import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AuthLayout, { Field } from '../../components/AuthLayout.jsx'
import { useAuth } from '../../store/AuthContext.jsx'

export default function ResetPassword() {
  const { uid, token } = useParams()
  const { redefinirSenha } = useAuth()
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [st, setSt] = useState({ s: '', m: '' })

  const enviar = async e => {
    e.preventDefault()
    if (senha.length < 8) return setSt({ s: 'err', m: 'A senha deve ter no mínimo 8 caracteres.' })
    setSt({ s: 'loading', m: '' })
    try {
      await redefinirSenha(uid, token, senha)
      setSt({ s: 'ok', m: 'Senha alterada com sucesso. Redirecionando para o login…' })
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) { setSt({ s: 'err', m: `Não foi possível alterar a senha: ${err.userMessage}` }) }
  }
  return (
    <AuthLayout eyebrow="Acesso" title="Criar nova senha" lead="Digite a nova senha da sua conta.">
      <form onSubmit={enviar}>
        {st.m && <div className={st.s === 'ok' ? 'msg-ok' : 'msg-err'}>{st.m}</div>}
        <Field label="Nova senha"><input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" required /></Field>
        <button className="btn dk big" type="submit" disabled={st.s === 'loading' || st.s === 'ok'}>{st.s === 'loading' ? 'Salvando…' : 'Salvar nova senha'}</button>
      </form>
      <div className="links"><Link className="sc" to="/login">Voltar para o login</Link></div>
    </AuthLayout>
  )
}
