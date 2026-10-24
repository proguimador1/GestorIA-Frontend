import { useEffect } from 'react'
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
