import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import { useAuth } from '../store/AuthContext.jsx'

// Cabeçalho: logotipo, status de sincronização, contador de itens e menu do perfil.
export default function Topbar() {
  const { S, syncing, resetAll } = useApp()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const out = e => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', out)
    return () => document.removeEventListener('click', out)
  }, [])

  const u = S.user
  const mercados = new Set(S.notes.map(n => n.est)).size
  const exportar = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }))
    a.download = 'gestoria-meus-dados.json'
    a.click()
  }

  return (
    <header className="top" ref={box}>
      <div className="logo">Gestor<b>IA</b></div>
      <div className={'sync' + (syncing ? ' busy' : '')}><i /><span>{syncing ? 'Sincronizando…' : 'Sincronizado'}</span></div>
      <div className="cnt" title="Produtos diferentes registrados em todas as suas notas fiscais">{S.catalog} itens catalogados</div>
      <div className="av" title="Meu perfil" onClick={() => setOpen(o => !o)}>{u.name[0]}</div>
      {open && (
        <div className="pmenu">
          <div className="pm-h"><div className="av big">{u.name[0]}</div><div><b>{u.name}</b><div className="lab" style={{ fontSize: 14 }}>{u.email}</div></div></div>
          <div className="pm-s">
            <div><b>{S.notes.length}</b><span>notas</span></div>
            <div><b>{S.catalog}</b><span>itens catalogados</span></div>
            <div><b>{mercados}</b><span>mercados</span></div>
          </div>
          <div className="pm-a">
            <Link to="/configuracoes">Editar perfil</Link>
            <Link to="/chatbot">Falar com o chatbot</Link>
            <span onClick={exportar}>Exportar meus dados (.json)</span>
            <span onClick={resetAll}>Restaurar dados de demonstração</span>
            <span onClick={logout} style={{ color: 'var(--red)' }}>Sair da conta</span>
          </div>
        </div>
      )}
    </header>
  )
}
