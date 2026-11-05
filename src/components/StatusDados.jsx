import { useApp } from '../store/AppContext.jsx'

// Aviso de carregamento, erro (com "Tentar novamente") ou modo de demonstração sem API.
export default function StatusDados() {
  const { mock, carregando, erroDados, erroDash, recarregar, S } = useApp()
  if (mock) return <div className="msg-err mt">Modo de demonstração: as notas e o dashboard vêm da API. Use VITE_MOCK_AUTH=false com o backend no ar para ver os seus dados.</div>
  const erro = erroDados || erroDash
  if (erro) return (
    <div className="msg-err mt" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span>{erro}</span><span className="sc" onClick={recarregar}>Tentar novamente</span>
    </div>
  )
  if (carregando) return <div className="lab mt" style={{ fontSize: 14 }}>{S.notes.length ? 'Atualizando dados…' : 'Carregando as suas notas…'}</div>
  return null
}
