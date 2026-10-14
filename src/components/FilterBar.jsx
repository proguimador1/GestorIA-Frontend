import Icon from './Icon.jsx'
import { useApp } from '../store/AppContext.jsx'
import { shiftAnchor } from '../lib/finance.js'
import { dm, today } from '../lib/utils.js'
import { CATS, EST } from '../data/seed.js'

// Barra de período (Semana, Mês, Personalizado), setas, atalho e, opcionalmente, filtros de categoria e estabelecimento.
export default function FilterBar({ chips }) {
  const { F, setF, fin } = useApp()
  const [s, e] = fin.range()
  const mode = m => setF({ mode: m, anchor: m === '30' ? today() : F.anchor })
  return (
    <div className="fbar">
      {[['week', 'Semana'], ['month', 'Mês'], ['30', 'Personalizado']].map(([m, t]) => (
        <span key={m} className={'seg' + (F.mode === m ? ' on' : '')} onClick={() => mode(m)}>{t}</span>
      ))}
      <span className="chip dt">
        <button onClick={() => setF({ anchor: shiftAnchor(F, -1) })}><Icon n="l" s={15} /></button>
        {dm(s)} – {dm(e)}/{e.slice(2, 4)}
        <button onClick={() => setF({ anchor: shiftAnchor(F, 1) })}><Icon n="r" s={15} /></button>
      </span>
      <span className="vr" /><span className="lab mono" style={{ fontSize: 10.5 }}>Atalho</span>
      <span className="sc" onClick={() => mode('30')}>Últimos 30 dias</span>
      {chips && (<>
        <div style={{ flexBasis: '100%' }} />
        {F.cat
          ? <span className="chip fil"><i className="dot" style={{ background: CATS[F.cat] }} />Categoria: {F.cat}<button onClick={() => setF({ cat: '' })}>×</button></span>
          : <select className="chip" value="" onChange={e => setF({ cat: e.target.value })}><option value="">Categoria: todas</option>{fin.allCats().map(c => <option key={c}>{c}</option>)}</select>}
        <select className="chip" value={F.est} onChange={e => setF({ est: e.target.value })}>
          <option value="">Estabelecimento: todos</option>{EST.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </>)}
    </div>
  )
}
