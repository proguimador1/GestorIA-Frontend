import { useState } from 'react'
import PageHead from '../components/PageHead.jsx'
import { useApp } from '../store/AppContext.jsx'

export default function Configuracoes() {
  const { S, setUser, toast, resetAll } = useApp()
  const [name, setName] = useState(S.user.name)
  const [email, setEmail] = useState(S.user.email)
  const salvar = () => { setUser({ name: name || S.user.name, email }); toast('Alterações salvas') }
  return (
    <>
      <PageHead eyebrow={`Conta · ${S.user.name.split(' ')[0].toUpperCase()}`}>Configurações</PageHead>
      <div style={{ maxWidth: 950 }}>
        <div className="card mt">
          <div className="mono lab" style={{ marginBottom: 18 }}>Perfil</div>
          <div className="grid2">
            <div className="fld"><label className="mono lab">Nome</label><input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="fld"><label className="mono lab">E-mail</label><input value={email} onChange={e => setEmail(e.target.value)} /></div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22 }}>
          <button className="btn" style={{ background: 'transparent', color: 'var(--mute)', border: '1px solid #bfc4ae' }} onClick={resetAll}>Restaurar dados de demonstração</button>
          <button className="btn dk big" onClick={salvar}>Salvar alterações</button>
        </div>
      </div>
    </>
  )
}
