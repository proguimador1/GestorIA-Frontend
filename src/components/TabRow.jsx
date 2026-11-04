import { useLocation } from 'react-router-dom'
import Icon from './Icon.jsx'
import SheetPreview from './SheetPreview.jsx'
import { useApp } from '../store/AppContext.jsx'
import { dm, estName } from '../lib/utils.js'

// Abas da tela + legenda e botão "Gerar planilha".
export default function TabRow({ tabs, active, onTab }) {
  const { F, fin, openModal } = useApp()
  const { pathname } = useLocation()
  const [s, e] = fin.range()
  const cap = `Planilha de ${F.mode === 'month' ? fin.lab() : dm(s) + '–' + dm(e)} · ${F.cat || 'todas as categorias'} · ${F.est ? estName(F.est) : 'todos os estabelecimentos'}`
  // Em Notas fiscais a prévia já está na página; nas demais abre em modal.
  const gerar = () => pathname.includes('notas')
    ? document.getElementById('prev')?.scrollIntoView({ behavior: 'smooth' })
    : openModal(<SheetPreview />)
  return (
    <div className="tabrow">
      {tabs.map(([k, t]) => <div key={k} className={'tab' + (active === k ? ' on' : '')} onClick={() => onTab && onTab(k)}>{t}</div>)}
      <span className="cap">{cap}</span>
      <button className="btn" onClick={gerar}><Icon n="dl" s={17} />Gerar planilha</button>
    </div>
  )
}
