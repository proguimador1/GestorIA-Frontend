import { NavLink } from 'react-router-dom'
import Icon from './Icon.jsx'

const NAV = [['inicio', 'home', 'Início'], ['cadastro', 'clip', 'Cadastro'], ['financas', 'chart', 'Finanças'], ['notas', 'rcpt', 'Notas fiscais'], ['chatbot', 'chat', 'Chatbot'], ['configuracoes', 'gear', 'Configurações']]

export default function Sidebar() {
  return (
    <nav className="side">
      {NAV.map(([to, i, t]) => (
        <NavLink key={to} to={'/' + to} className={({ isActive }) => 'nav' + (isActive ? ' on' : '')}>
          <Icon n={i} s={20} /><span>{t}</span>
        </NavLink>
      ))}
    </nav>
  )
}
