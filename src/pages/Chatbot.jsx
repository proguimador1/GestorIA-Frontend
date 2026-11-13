import { useCallback, useEffect, useRef, useState } from 'react'
import PageHead from '../components/PageHead.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useApp } from '../store/AppContext.jsx'
import { NOVO_TITULO, useChats } from '../store/useChats.js'
import { RESPOSTA_FORA, SUG, foraDoEscopo, relatorioPadrao, responder } from '../lib/chat.js'
import { motivoLocal, perguntarLLM, tituloLLM } from '../services/llm.js'
import { dmy } from '../lib/utils.js'

const espera = ms => new Promise(ok => setTimeout(ok, ms))
const KEY_SUG = 'gestoria.sugestoes'   // sugestões abertas ou recolhidas (preferência do navegador)
const lerSug = () => { try { return localStorage.getItem(KEY_SUG) !== 'fechado' } catch { return true } }
const Seta = ({ cima }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{cima ? <path d="M6 15l6-6 6 6" /> : <path d="M6 9l6 6 6-6" />}</svg>

// Texto entre ** ** vira negrito (sem usar HTML, evitando injeção de conteúdo).
const negrito = t => t.split('**').map((p, i) => i % 2 ? <b key={i}>{p}</b> : p)

// Desenha a resposta estruturada: ### título · - lista · 1. lista numerada · > observação
function Rico({ t }) {
  const blocos = []
  t.split('\n').forEach((l, k) => {
    const ult = blocos[blocos.length - 1]
    if (l.startsWith('### ')) blocos.push(<h4 key={k}>{negrito(l.slice(4))}</h4>)
    else if (l.startsWith('- ')) { if (ult?.tipo === 'ul') ult.itens.push(l.slice(2)); else blocos.push({ tipo: 'ul', k, itens: [l.slice(2)] }) }
    else if (/^\d+\. /.test(l)) { if (ult?.tipo === 'ol') ult.itens.push(l.replace(/^\d+\. /, '')); else blocos.push({ tipo: 'ol', k, itens: [l.replace(/^\d+\. /, '')] }) }
    else if (l.startsWith('> ')) blocos.push(<p key={k} className="obs">{negrito(l.slice(2))}</p>)
    else if (l.trim()) blocos.push(<p key={k}>{negrito(l)}</p>)
  })
  return blocos.map(b => b.tipo === 'ul' ? <ul key={b.k}>{b.itens.map((x, i) => <li key={i}>{negrito(x)}</li>)}</ul>
    : b.tipo === 'ol' ? <ol key={b.k}>{b.itens.map((x, i) => <li key={i}>{negrito(x)}</li>)}</ol> : b)
}

export default function Chatbot() {
  const { S } = useApp()
  const { chat, lista, ativo, novo, abrir, excluir, atualizar } = useChats()
  const [txt, setTxt] = useState('')
  const [pensando, setPensando] = useState(null)   // id do chat aguardando resposta
  const [rel, setRel] = useState(null)             // seletor de intervalo do relatório: { de, ate }
  const [apagando, setApagando] = useState(null)   // chat aguardando a confirmação de exclusão
  const [sugAberta, setSugAberta] = useState(lerSug)
  const log = useRef(null), input = useRef(null)
  useEffect(() => { try { localStorage.setItem(KEY_SUG, sugAberta ? 'aberto' : 'fechado') } catch { /* sem armazenamento */ } }, [sugAberta])
  useEffect(() => { log.current && (log.current.scrollTop = log.current.scrollHeight); input.current?.focus() }, [chat.msgs.length, pensando, ativo])

  // Envia a pergunta. A resposta vem do Gemini (que consulta as notas pelas ferramentas); se a LLM não estiver
  // disponível, vem das regras locais (src/lib/chat.js), com um aviso na primeira vez em cada chat.
  const enviar = async t => {
    if (!t.trim() || pensando) return
    const id = chat.id, historico = chat.msgs, ctxAnt = chat.ctx || {}, semTitulo = chat.title === NOVO_TITULO
    atualizar(id, c => ({ msgs: [...c.msgs, { from: 'me', t }] }))
    setTxt(''); setRel(null); setPensando(id)

    const local = responder(t, S, ctxAnt)          // regras locais: memória, título e resposta de reserva
    const inicio = Date.now()
    let resposta, origem = 'llm', aviso = null
    if (foraDoEscopo(t)) { resposta = RESPOSTA_FORA; origem = 'regras' }
    else {
      try { resposta = await perguntarLLM(t, historico, S) }
      catch (e) {
        resposta = local.t; origem = 'regras'
        if (!ctxAnt.avisoLocal) aviso = `> Resposta calculada pelas regras locais do GestorIA: ${motivoLocal(e)}.`
      }
    }
    let titulo = semTitulo ? local.title : null
    if (semTitulo && !titulo && origem === 'llm') titulo = await tituloLLM(t)
    const falta = 500 - (Date.now() - inicio); if (falta > 0) await espera(falta)   // a animação aparece por pelo menos meio segundo

    atualizar(id, c => ({
      msgs: [...c.msgs, { from: 'bot', t: aviso ? resposta + '\n' + aviso : resposta, origem }],
      ctx: { ...local.ctx, avisoLocal: ctxAnt.avisoLocal || !!aviso },
      title: c.title === NOVO_TITULO && titulo ? titulo : c.title,
    }))
    setPensando(null)
  }
  const sugestao = s => {
    if (s === 'Gerar relatório') { const [de, ate] = relatorioPadrao(); setRel(r => r ? null : { de, ate }); return }
    enviar(s)
  }
  const gerarRelatorio = () => { if (rel.de && rel.ate) enviar(`Gerar relatório de ${dmy(rel.de <= rel.ate ? rel.de : rel.ate)} a ${dmy(rel.de <= rel.ate ? rel.ate : rel.de)}`) }
  const pedirApagar = (e, c) => { e.stopPropagation(); setApagando(c) }
  const apagar = () => { excluir(apagando.id); setApagando(null) }
  const naoApagar = useCallback(() => setApagando(null), [])

  return (
    <>
      <PageHead eyebrow="Chatbot · GestorIA">Pergunte sobre as suas compras</PageHead>
      <div className="chatwrap mt">
        <aside className="card chatside">
          <button className="btn dk" style={{ width: '100%', justifyContent: 'center' }} onClick={novo}>+ Novo chat</button>
          <div className="mono lab" style={{ margin: '18px 4px 8px' }}>Histórico</div>
          <div className="scr chatlist">
            {lista.map(c => (
              <div key={c.id} className={'chatitem' + (c.id === ativo ? ' on' : '')} onClick={() => abrir(c.id)} title={c.title}>
                <span>{c.title}</span>
                <button className="x" title="Excluir chat" aria-label="Excluir chat" onClick={e => pedirApagar(e, c)}>×</button>
              </div>
            ))}
          </div>
        </aside>

        <div className="card chatmain">
          <div ref={log} className="scr chatlog">
            {chat.msgs.map((m, i) => <div key={i} className={'msg ' + m.from}>{m.from === 'bot' ? <Rico t={m.t} /> : m.t}</div>)}
            {pensando === chat.id && <div className="msg bot typing" aria-label="GestorIA está analisando"><span className="spin"><i /><i /><i /></span>Analisando suas notas…</div>}
          </div>
          {rel && (
            <div className="relbar">
              <b>Relatório do período</b>
              <label>De <input type="date" value={rel.de} onChange={e => setRel({ ...rel, de: e.target.value })} /></label>
              <label>Até <input type="date" value={rel.ate} onChange={e => setRel({ ...rel, ate: e.target.value })} /></label>
              <button className="btn dk" onClick={gerarRelatorio} disabled={!rel.de || !rel.ate || !!pensando}>Gerar</button>
              <span className="sc" onClick={() => setRel(null)}>Cancelar</span>
            </div>
          )}
          <div className={'sugbox' + (sugAberta ? '' : ' fechado')}>
            <button className="sugseta" onClick={() => setSugAberta(v => !v)} aria-expanded={sugAberta} aria-controls="sugestoes"
              title={sugAberta ? 'Ocultar sugestões' : 'Mostrar sugestões'} aria-label={sugAberta ? 'Ocultar sugestões de perguntas' : 'Mostrar sugestões de perguntas'}>
              <Seta cima={!sugAberta} />
            </button>
            {sugAberta && <div className="chips" id="sugestoes">{SUG.map(s => <span key={s} className={'chip' + (s === 'Gerar relatório' ? ' fil' : '')} onClick={() => sugestao(s)}>{s}</span>)}</div>}
          </div>
          <div className="chatin">
            <input ref={input} value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviar(txt)} placeholder="Escreva sua pergunta…" autoComplete="off" />
            <button className="btn dk" onClick={() => enviar(txt)} disabled={!!pensando}>Enviar</button>
          </div>
        </div>
      </div>
      {apagando && <ConfirmDialog texto="Deseja apagar este chat?" detalhe={apagando.title} confirmar="Apagar" onConfirm={apagar} onCancel={naoApagar} />}
    </>
  )
}
