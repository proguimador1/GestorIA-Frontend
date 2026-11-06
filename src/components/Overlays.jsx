import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'

export function Modal() {
  const { modal, closeModal } = useApp()
  const { pathname } = useLocation()
  useEffect(() => { closeModal() }, [pathname, closeModal])   // trocar de tela fecha o modal
  useEffect(() => {
    if (!modal) return
    const esc = e => e.key === 'Escape' && closeModal()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [modal, closeModal])
  if (!modal) return null
  return (
    <div className="modal" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
      <div className="box">
        {modal}
        <div style={{ textAlign: 'right', marginTop: 14 }}><span className="sc" onClick={closeModal}>Fechar</span></div>
      </div>
    </div>
  )
}

export function Toast() {
  const { toastMsg } = useApp()
  return toastMsg ? <div className="toast">{toastMsg}</div> : null
}

// Diálogo de confirmação no estilo do app: fundo verde escuro, letras brancas e a página ao fundo desfocada.
// Abre por confirmar({ titulo, destaque, texto, confirmar, cancelar, perigo }) (useApp) e devolve true ou false.
// Esc, clique fora e troca de tela cancelam; o foco começa em "Cancelar" e fica preso nos dois botões.
export function Confirm() {
  const { dialogo, responderDialogo } = useApp()
  const { pathname } = useLocation()
  const refNao = useRef(null), refSim = useRef(null)

  useEffect(() => { responderDialogo(false) }, [pathname, responderDialogo])
  useEffect(() => () => responderDialogo(false), [responderDialogo])
  useEffect(() => {
    if (!dialogo) return
    const anterior = document.activeElement, overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden' // a página de fundo não rola
    refNao.current?.focus()
    const tecla = e => {
      if (e.key === 'Escape') { e.preventDefault(); responderDialogo(false) }
      else if (e.key === 'Tab') {
        const a = refNao.current, b = refSim.current
        const alvo = e.shiftKey ? (document.activeElement === a ? b : a) : (document.activeElement === b ? a : b)
        if (document.activeElement !== a && document.activeElement !== b) { e.preventDefault(); a.focus(); return }
        if (alvo) { e.preventDefault(); alvo.focus() }
      }
    }
    window.addEventListener('keydown', tecla)
    return () => { window.removeEventListener('keydown', tecla); document.body.style.overflow = overflow; anterior?.focus?.() }
  }, [dialogo, responderDialogo])

  if (!dialogo) return null
  const { titulo, destaque, texto, confirmar = 'Confirmar', cancelar = 'Cancelar', perigo } = dialogo
  return (
    <div className="cdlg" onMouseDown={e => { if (e.target === e.currentTarget) responderDialogo(false) }}>
      <div className="cdlg-box" role="alertdialog" aria-modal="true" aria-labelledby="cdlg-t" aria-describedby="cdlg-d">
        <h2 id="cdlg-t">{titulo}</h2>
        <div id="cdlg-d">
          {destaque && <div className="cdlg-tag">{destaque}</div>}
          {[].concat(texto || []).map((t, i) => <p key={i}>{t}</p>)}
        </div>
        <div className="cdlg-acoes">
          <button type="button" ref={refNao} className="cdlg-nao" onClick={() => responderDialogo(false)}>{cancelar}</button>
          <button type="button" ref={refSim} className={'cdlg-sim' + (perigo ? ' perigo' : '')} onClick={() => responderDialogo(true)}>{confirmar}</button>
        </div>
      </div>
    </div>
  )
}
