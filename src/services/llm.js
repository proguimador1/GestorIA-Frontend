// Cliente da LLM (Google Gemini) no navegador. Conversa só com o servidor do próprio app (/api/chat), que guarda
// a chave e repassa ao Gemini. Quando o Gemini pede uma ferramenta (functionCall), ela é executada aqui sobre as
// notas do usuário (src/lib/chat.js) e o resultado volta ao Gemini (functionResponse), que então redige a resposta.
import { contextoLLM, executarFerramenta } from '../lib/chat.js'

const RODADAS_MAX = 5        // limite de idas e voltas com ferramentas por pergunta
const HISTORICO_MAX = 12     // últimas mensagens enviadas como memória da conversa
const TEMPO_MAX = 45000      // 45 s por chamada: depois disso, a pergunta cai nas regras locais (não trava o chat)

export class ErroLLM extends Error {
  constructor(codigo, detalhe) { super(detalhe || codigo); this.codigo = codigo }
}

async function chamar(corpo) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), TEMPO_MAX)
  let r
  try {
    r = await fetch('api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo), signal: ctrl.signal })
  } catch (e) {
    throw e.name === 'AbortError' ? new ErroLLM('tempo', 'o Gemini demorou demais') : new ErroLLM('rede', 'sem conexão com o servidor do app')
  } finally { clearTimeout(t) }
  const dados = await r.json().catch(() => ({}))
  if (r.status === 404) throw new ErroLLM('sem_servidor', 'o servidor da LLM só existe com npm run dev ou npm run preview')
  if (!r.ok) throw new ErroLLM(dados.erro || 'falha', dados.detalhe)
  return dados.content
}

// Mensagens do chat (from: me | bot) → conteúdos do Gemini. A mensagem de boas-vindas não é enviada.
const paraGemini = msgs => msgs.filter((m, i) => !(i === 0 && m.from === 'bot'))
  .slice(-HISTORICO_MAX).map(m => ({ role: m.from === 'me' ? 'user' : 'model', parts: [{ text: m.t }] }))

// Texto final da resposta (ignora partes de raciocínio)
const textoDe = content => (content?.parts || []).filter(p => typeof p.text === 'string' && !p.thought).map(p => p.text).join('').trim()

// Responde uma pergunta com o Gemini. historico: mensagens anteriores do chat. S: dados do app.
export async function perguntarLLM(pergunta, historico, S) {
  const contexto = contextoLLM(S)
  const contents = [...paraGemini(historico), { role: 'user', parts: [{ text: pergunta }] }]
  for (let i = 0; i < RODADAS_MAX; i++) {
    const content = await chamar({ modo: 'chat', contexto, contents })
    const chamadas = (content?.parts || []).filter(p => p.functionCall)
    if (!chamadas.length) {
      const texto = textoDe(content)
      if (!texto) throw new ErroLLM('vazia', 'resposta vazia do Gemini')
      return texto
    }
    // A resposta do modelo volta exatamente como veio (com thoughtSignature), e depois todas as respostas das funções.
    contents.push(content)
    contents.push({
      role: 'user',
      parts: chamadas.map(({ functionCall: fc }) => {
        let resultado
        try { resultado = executarFerramenta(fc.name, fc.args || {}, S) } catch (e) { resultado = 'Erro ao consultar os dados: ' + e.message }
        return { functionResponse: { ...(fc.id ? { id: fc.id } : {}), name: fc.name, response: { resultado } } }
      }),
    })
  }
  throw new ErroLLM('rodadas', 'consultas demais para uma pergunta')
}

// Título curto para o chat (barra lateral), quando as regras locais não reconhecem o assunto.
export async function tituloLLM(pergunta) {
  try {
    const t = textoDe(await chamar({ modo: 'titulo', contents: [{ role: 'user', parts: [{ text: pergunta }] }] })).replace(/["“”.*#]/g, '').split('\n')[0].trim()
    return t ? t.slice(0, 48) : null
  } catch { return null }
}

// Motivo amigável para quando a resposta vem do modo local
export const motivoLocal = e => ({
  sem_chave: 'a chave do Gemini não está configurada',
  sem_servidor: 'o app está aberto sem o servidor (use npm run dev)',
  rede: 'não foi possível falar com o servidor do app',
  tempo: 'o Gemini demorou demais para responder',
}[e?.codigo] || 'o Gemini não respondeu' + (e?.message && e.message !== e?.codigo ? ` (${e.message})` : ''))
