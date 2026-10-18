import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthLayout, { Field } from '../../components/AuthLayout.jsx'
import { useAuth } from '../../store/AuthContext.jsx'

export default function Login() {
  const { login, mock } = useAuth()
  const { state } = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ver, setVer] = useState(false)
  const [erro, setErro] = useState('')
  const [busy, setBusy] = useState(false)

  const enviar = async e => {
    e.preventDefault(); setErro(''); setBusy(true)
    try { await login(email.trim(), password) }
    catch (err) { setErro(err.userMessage || 'Não foi possível entrar.'); setBusy(false) }
  }

  return (
    <AuthLayout eyebrow="Acesso" title="Entrar na sua conta" lead="Use o e-mail e a senha cadastrados para acessar suas notas e finanças."
      footer={mock && <p className="ahint" style={{ textAlign: 'center', marginTop: 16 }}>Modo de demonstração: as contas ficam salvas só neste navegador.</p>}>
      <form onSubmit={enviar}>
        {state?.msg && <div className="msg-ok">{state.msg}</div>}
        {erro && <div className="msg-err">{erro}</div>}
        <Field label="E-mail"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email" required /></Field>
        <Field label="Senha">
          <div className="pw">
            <input type={ver ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" autoComplete="current-password" required />
            <button type="button" onClick={() => setVer(v => !v)}>{ver ? 'Ocultar' : 'Mostrar'}</button>
          </div>
        </Field>
        <button className="btn dk big" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <div className="links">
        <Link className="sc" to="/esqueci-senha">Esqueci a senha</Link>
        <Link className="sc" to="/criar-conta">Criar conta</Link>
      </div>
    </AuthLayout>
  )
}
