import { useEffect, useRef } from 'react'

// Pop-up de confirmação: caixa verde com letras brancas sobre o resto da aplicação, que fica translúcido.
// Esc ou clique fora da caixa equivalem a "Cancelar". O foco começa em "Cancelar" (a opção segura).
export default function ConfirmDialog({ texto, detalhe, confirmar = 'Confirmar', onConfirm, onCancel }) {
  const cancelar = useRef(null)

  useEffect(() => {
    const o = document.body.style.overflow
    document.body.style.overflow = 'hidden' // a página de fundo não rola enquanto o pop-up está aberto
    cancelar.current?.focus()
    const esc = e => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = o; window.removeEventListener('keydown', esc) }
  }, [onCancel])

  return (
    <div className="popup" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="confirm-tit" aria-describedby={detalhe ? 'confirm-det' : undefined}>
        <h2 id="confirm-tit">{texto}</h2>
        {detalhe && <p id="confirm-det">{detalhe}</p>}
        <div className="confirm-acoes">
          <button ref={cancelar} className="btn cancel" onClick={onCancel}>Cancelar</button>
          <button className="btn confirm-ok" onClick={onConfirm}>{confirmar}</button>
        </div>
      </div>
    </div>
  )
}
