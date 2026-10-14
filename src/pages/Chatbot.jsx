import { useEffect, useRef, useState } from 'react'
import PageHead from '../components/PageHead.jsx'
import { useApp } from '../store/AppContext.jsx'
import { SUG, chatAnswer } from '../lib/chat.js'

// Texto entre ** ** vira negrito (sem usar HTML, evitando injeção de conteúdo).
const rich = t => t.split('**').map((p, i) => i % 2 ? <b key={i}>{p}</b> : p)

export default function Chatbot() {
  const { S, fin, chat, setChat } = useApp()
  const [txt, setTxt] = useState('')
  const log = useRef(null), input = useRef(null)
  useEffect(() => { log.current.scrollTop = log.current.scrollHeight; input.current.focus() }, [chat])
  const send = t => { if (!t.trim()) return; setChat(c => [...c, { from: 'me', t }, { from: 'bot', t: chatAnswer(t, S, fin) }]); setTxt('') }
  return (
    <>
      <PageHead eyebrow="Chatbot · GestorIA">Pergunte sobre as suas compras</PageHead>
      <div className="card mt" style={{ maxWidth: 860, padding: 0, overflow: 'hidden' }}>
        <div ref={log} className="scr chatlog">{chat.map((m, i) => <div key={i} className={'msg ' + m.from}>{rich(m.t)}</div>)}</div>
        <div className="chips">{SUG.map(s => <span key={s} className="chip" onClick={() => send(s)}>{s}</span>)}</div>
        <div className="chatin">
          <input ref={input} value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(txt)} placeholder="Escreva sua pergunta…" autoComplete="off" />
          <button className="btn dk" onClick={() => send(txt)}>Enviar</button>
        </div>
      </div>
      <p className="lab" style={{ marginTop: 14, fontSize: 12.5 }}>As respostas vêm de consultas às notas cadastradas, não de um modelo de linguagem.</p>
    </>
  )
}
