import { useNavigate } from 'react-router-dom'
import PageHead from '../components/PageHead.jsx'
import Icon from '../components/Icon.jsx'
import { useApp } from '../store/AppContext.jsx'
import { MES, dt, today } from '../lib/utils.js'

export default function Inicio() {
  const { S, setF } = useApp()
  const nav = useNavigate()
  const d = dt(today())
  const Card = ({ to, icon, title, text, red, onClick }) => (
    <div className="act" onClick={() => { onClick?.(); nav(to) }}>
      <span style={red ? { color: 'var(--red)' } : undefined}><Icon n={icon} s={30} /></span>
      <h3>{title}</h3><p>{text}</p>
      <div className="go mono" style={red ? { color: 'var(--red)' } : undefined}>Abrir <Icon n="up" s={14} /></div>
    </div>
  )
  return (
    <>
      <PageHead eyebrow={`Painel · ${d.getUTCDate()} de ${MES[d.getUTCMonth()].toUpperCase()}`}>
        Oi, {S.user.name.split(' ')[0]}. <em className="serif" style={{ fontStyle: 'italic' }}>O que vamos fazer hoje?</em>
      </PageHead>
      <div className="cards3">
        <Card to="/cadastro" icon="scan" title="Cadastrar itens" text="Leia o QR Code da sua nota fiscal pela webcam." />
        <Card to="/financas" icon="chart" title="Visualizar finanças" text="Gastos por período, comparação entre mercados e planilhas." onClick={() => setF({ tab: 'visao' })} />
        <Card red to="/chatbot" icon="chat" title="Conversar com o GestorIA" text="Converse com o agente, relatórios e dúvidas rápidas." />
      </div>
    </>
  )
}
