import { useState } from 'react'
import PageHead from '../components/PageHead.jsx'
import { useApp } from '../store/AppContext.jsx'
import { useAuth } from '../store/AuthContext.jsx'

// Perfil da conta: o nome é salvo no backend (PATCH /auth/users/me/); o e-mail é o login e não muda aqui.
export default function Configuracoes() {
  const { S, toast } = useApp()
  const { atualizarNome } = useAuth()
  const [name, setName] = useState(S.user.name)
  const [salvando, setSalvando] = useState(false)
  const salvar = async () => {
    const nome = name.trim()
    if (!nome) return toast('Informe o nome.')
    setSalvando(true)
    try { await atualizarNome(nome); toast('Alterações salvas') }
    catch (e) { toast(e.userMessage || 'Não foi possível salvar o nome.') }
    finally { setSalvando(false) }
  }
  return (
    <>
      <PageHead eyebrow={`Conta · ${S.user.name.split(' ')[0].toUpperCase()}`}>Configurações</PageHead>
      <div style={{ maxWidth: 950 }}>
        <div className="card mt">
          <div className="mono lab" style={{ marginBottom: 18 }}>Perfil</div>
          <div className="grid2">
            <div className="fld"><label className="mono lab">Nome completo</label><input value={name} maxLength={100} onChange={e => setName(e.target.value)} /></div>
            <div className="fld"><label className="mono lab">E-mail (login)</label><input value={S.user.email} readOnly disabled /></div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
          <button className="btn dk big" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar alterações'}</button>
        </div>
      </div>
    </>
  )
}
