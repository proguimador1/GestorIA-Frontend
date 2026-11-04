import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout, { Field } from '../../components/AuthLayout.jsx'
import { useAuth } from '../../store/AuthContext.jsx'

export default function Register() {
  const { cadastro } = useAuth()
  const navigate = useNavigate()
  const [f, setF] = useState({ nome_completo: '', email: '', password: '', re_password: '' })
  const [ver, setVer] = useState(false)
  const [erro, setErro] = useState('')
  const [busy, setBusy] = useState(false)
  const mudar = e => setF({ ...f, [e.target.name]: e.target.value })

  const enviar = async e => {
    e.preventDefault(); setErro('')
    if (f.password.length < 8) return setErro('A senha deve ter no mínimo 8 caracteres.')
    if (f.password !== f.re_password) return setErro('As senhas não coincidem.')
    setBusy(true)
    try {
      await cadastro(f.email.trim(), f.nome_completo.trim(), f.password, f.re_password)
      navigate('/login', { state: { msg: 'Conta criada com sucesso. Faça o login.' } })
    } catch (err) { setErro(err.userMessage || 'Não foi possível criar a conta.'); setBusy(false) }
  }

  return (
    <AuthLayout eyebrow="Cadastro" title="Criar conta" lead="Preencha os dados abaixo para começar a organizar as compras da sua cozinha.">
      <form onSubmit={enviar}>
        {erro && <div className="msg-err">{erro}</div>}
        <Field label="Nome completo"><input name="nome_completo" value={f.nome_completo} onChange={mudar} placeholder="Seu nome completo" autoComplete="name" required /></Field>
        <Field label="E-mail"><input name="email" type="email" value={f.email} onChange={mudar} placeholder="voce@exemplo.com" autoComplete="email" required /></Field>
        <Field label="Senha">
          <div className="pw">
            <input name="password" type={ver ? 'text' : 'password'} value={f.password} onChange={mudar} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" required />
            <button type="button" onClick={() => setVer(v => !v)}>{ver ? 'Ocultar' : 'Mostrar'}</button>
          </div>
        </Field>
        <Field label="Confirmação de senha"><input name="re_password" type={ver ? 'text' : 'password'} value={f.re_password} onChange={mudar} placeholder="Repita a senha" autoComplete="new-password" required /></Field>
        <button className="btn dk big" type="submit" disabled={busy}>{busy ? 'Criando…' : 'Cadastrar'}</button>
      </form>
      <div className="links"><Link className="sc" to="/login">Já tem conta? Entrar</Link></div>
    </AuthLayout>
  )
}
