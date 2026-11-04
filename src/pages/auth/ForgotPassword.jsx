import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout, { Field } from '../../components/AuthLayout.jsx'
import { useAuth } from '../../store/AuthContext.jsx'

export default function ForgotPassword() {
  const { solicitarRecuperacao } = useAuth()
  const [email, setEmail] = useState('')
  const [st, setSt] = useState({ s: '', m: '' })

  const enviar = async e => {
    e.preventDefault(); setSt({ s: 'loading', m: '' })
    try { await solicitarRecuperacao(email.trim()); setSt({ s: 'ok', m: 'Link de recuperação enviado. Confira seu e-mail.' }) }
    catch (err) { setSt({ s: 'err', m: `Não foi possível iniciar a recuperação: ${err.userMessage}` }) }
  }
  return (
    <AuthLayout eyebrow="Acesso" title="Esqueci minha senha" lead="Informe o e-mail cadastrado e enviaremos um link para criar uma nova senha.">
      <form onSubmit={enviar}>
        {st.m && <div className={st.s === 'ok' ? 'msg-ok' : 'msg-err'}>{st.m}</div>}
        <Field label="E-mail cadastrado"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" required /></Field>
        <button className="btn dk big" type="submit" disabled={st.s === 'loading'}>{st.s === 'loading' ? 'Enviando…' : 'Enviar link de recuperação'}</button>
      </form>
      <div className="links"><Link className="sc" to="/login">Voltar para o login</Link></div>
    </AuthLayout>
  )
}
