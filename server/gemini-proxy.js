// Ponte entre o chatbot e o Google Gemini, executada no servidor do Vite (Node), nunca no navegador.
// A chave GEMINI_API_KEY é lida de .env.local pelo vite.config.js e fica só aqui: ela não entra no
// código enviado ao navegador nem aparece nas respostas.
//
// Rotas (npm run dev e npm run preview):
//   GET  /api/chat/status          → { ativo, modelo }            (ativo = há chave configurada)
//   GET  /api/chat/status?testar=1 → { ativo, modelo, teste }     (faz uma chamada curta para validar chave e modelo)
//   POST /api/chat                 → { content, finishReason }    (uma rodada do chat; pode trazer functionCall)
//        corpo: { modo: 'chat' | 'titulo', contexto, contents }
//
// API usada: generateContent (https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent).
import { FERRAMENTAS, INSTRUCAO_TITULO, MODELO_PADRAO, instrucaoSistema } from '../src/lib/llm.js'

const LIMITE_CORPO = 300 * 1024   // 300 KB por requisição
const TEMPO_MAX = 40000            // 40 s por chamada ao Gemini

function lerCorpo(req) {
  return new Promise((ok, erro) => {
    let tam = 0
    const partes = []
    req.on('data', c => { tam += c.length; if (tam > LIMITE_CORPO) { erro(Object.assign(new Error('Requisição grande demais'), { status: 413 })); req.destroy() } else partes.push(c) })
    req.on('end', () => { try { ok(JSON.parse(Buffer.concat(partes).toString('utf8') || '{}')) } catch { erro(Object.assign(new Error('JSON inválido'), { status: 400 })) } })
    req.on('error', erro)
  })
}

const responder = (res, status, obj) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)) }

// Só passam conteúdos de usuário e do modelo, com as partes que o chat usa. A instrução de sistema é sempre
// a do servidor, para que as restrições do GestorIA não possam ser trocadas pelo navegador.
// As partes do modelo voltam sem alteração (inclusive thoughtSignature, exigida pelo Gemini 3 nas chamadas de função).
const PARTES = ['text', 'thought', 'thoughtSignature', 'functionCall', 'functionResponse']
const limpar = cs => (Array.isArray(cs) ? cs : []).slice(-40)
  .filter(c => ['user', 'model'].includes(c?.role) && Array.isArray(c.parts))
  .map(c => ({
    role: c.role,
    parts: c.parts.map(p => Object.fromEntries(Object.entries(p || {}).filter(([k]) => PARTES.includes(k))))
      .map(p => typeof p.text === 'string' ? { ...p, text: p.text.slice(0, 20000) } : p)
      .filter(p => Object.keys(p).length),
  }))
  .filter(c => c.parts.length)

export function geminiProxy(env) {
  const chave = (env.GEMINI_API_KEY || '').trim()
  const modelo = (env.GEMINI_MODEL || MODELO_PADRAO).trim().replace(/^models\//, '')
  const base = (env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '')

  async function gerar(payload) {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), TEMPO_MAX)
    let r
    try {
      r = await fetch(`${base}/models/${encodeURIComponent(modelo)}:generateContent`, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
        body: JSON.stringify(payload),
      })
    } finally { clearTimeout(t) }
    const dados = await r.json().catch(() => ({}))
    if (!r.ok) throw Object.assign(new Error(dados?.error?.message || `Falha no Gemini (HTTP ${r.status})`), { status: 502, codigo: 'gemini', http: r.status })
    const cand = dados?.candidates?.[0]
    if (!cand?.content?.parts?.length) {
      const motivo = dados?.promptFeedback?.blockReason || cand?.finishReason || 'resposta vazia'
      throw Object.assign(new Error(`O Gemini não gerou resposta (${motivo})`), { status: 502, codigo: 'gemini' })
    }
    return { content: { role: 'model', parts: cand.content.parts }, finishReason: cand.finishReason }
  }

  const middleware = async (req, res, next) => {
    const [url, qs = ''] = (req.url || '').split('?')
    if (url === '/api/chat/status' && req.method === 'GET') {
      if (!/(^|&)testar=1/.test(qs) || !chave) return responder(res, 200, { ativo: !!chave, modelo })
      try {
        const r = await gerar({ contents: [{ role: 'user', parts: [{ text: 'Responda apenas: OK' }] }], generationConfig: { maxOutputTokens: 512 } })
        return responder(res, 200, { ativo: true, modelo, teste: 'ok', resposta: r.content.parts.filter(p => p.text && !p.thought).map(p => p.text).join('').trim() })
      } catch (e) { return responder(res, 200, { ativo: true, modelo, teste: 'falhou', detalhe: e.name === 'AbortError' ? 'o Gemini demorou para responder' : e.message }) }
    }
    if (url !== '/api/chat') return next()
    if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST' })
    if (!chave) return responder(res, 503, { erro: 'sem_chave', detalhe: 'GEMINI_API_KEY não configurada em .env.local' })

    try {
      const corpo = await lerCorpo(req)
      const contents = limpar(corpo.contents)
      if (!contents.length) return responder(res, 400, { erro: 'vazio', detalhe: 'Nenhuma mensagem enviada' })
      // Temperatura no padrão do modelo: a documentação do Gemini 3 desaconselha valores baixos (podem causar repetição).
      const payload = corpo.modo === 'titulo'
        ? { systemInstruction: { parts: [{ text: INSTRUCAO_TITULO }] }, contents: contents.filter(c => c.role === 'user').slice(0, 1), generationConfig: { maxOutputTokens: 1024 } }
        : {
            systemInstruction: { parts: [{ text: instrucaoSistema(corpo.contexto) }] },
            contents,
            tools: [{ functionDeclarations: FERRAMENTAS }],
            toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
            generationConfig: { maxOutputTokens: 8192 },
          }
      responder(res, 200, await gerar(payload))
    } catch (e) {
      if (e.name === 'AbortError') return responder(res, 504, { erro: 'tempo', detalhe: 'O Gemini demorou para responder' })
      responder(res, e.status || 502, { erro: e.codigo || 'falha', detalhe: e.message })
    }
  }

  return {
    name: 'gestoria-gemini-proxy',
    configureServer: server => { server.middlewares.use(middleware) },
    configurePreviewServer: server => { server.middlewares.use(middleware) },
  }
}
