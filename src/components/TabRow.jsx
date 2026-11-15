import Icon from './Icon.jsx'
import SheetPreview from './SheetPreview.jsx'
import { useApp } from '../store/AppContext.jsx'

// Abas da tela e botão "Gerar planilha" (alinhado à direita, sem texto ao lado).
export default function TabRow({ tabs, active, onTab }) {
  const { openModal } = useApp()
  // Em todas as abas o botão abre a prévia da planilha (em modal), com o botão de baixar.
  const gerar = () => openModal(<SheetPreview />)
  return (
    <div className="tabrow">
      {tabs.map(([k, t]) => <div key={k} className={'tab' + (active === k ? ' on' : '')} onClick={() => onTab && onTab(k)}>{t}</div>)}
      <button className="btn" onClick={gerar} style={{ marginLeft: 'auto' }}><Icon n="dl" s={17} />Gerar planilha</button>
    </div>
  )
}
