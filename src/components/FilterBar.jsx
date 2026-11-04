import Icon from './Icon.jsx'
import { useApp } from '../store/AppContext.jsx'
import { shiftAnchor } from '../lib/finance.js'
import { add, dm, today } from '../lib/utils.js'
import { EST } from '../data/seed.js'

// Barra de período (Semana, Mês, Personalizado com data inicial e final), atalho e filtros opcionais.
export default function FilterBar({ chips }) {
  const { F, setF, fin, catColor } = useApp()
  const [s, e] = fin.range()
  const mode = m => setF({ mode: m, anchor: m === 'custom' ? F.anchor : F.anchor })
  const last30 = () => setF({ mode: 'custom', from: add(today(), -29), to: today() })
  const setFrom = v => v && setF({ from: v, to: v > F.to ? v : F.to })
  const setTo = v => v && setF({ to: v, from: v < F.from ? v : F.from })
  return (
    <div className="fbar">
      {[['week', 'Semana'], ['month', 'Mês'], ['custom', 'Personalizado']].map(([m, t]) => (
        <span key={m} className={'seg' + (F.mode === m ? ' on' : '')} onClick={() => mode(m)}>{t}</span>
      ))}
      {F.mode === 'custom' ? (
        <span className="chip dt range">
          <label>De <input type="date" value={F.from} max={F.to} onChange={ev => setFrom(ev.target.value)} /></label>
          <label>até <input type="date" value={F.to} min={F.from} onChange={ev => setTo(ev.target.value)} /></label>
        </span>
      ) : (
        <span className="chip dt">
          <button onClick={() => setF({ anchor: shiftAnchor(F, -1) })}><Icon n="l" s={15} /></button>
          {dm(s)} – {dm(e)}/{e.slice(2, 4)}
          <button onClick={() => setF({ anchor: shiftAnchor(F, 1) })}><Icon n="r" s={15} /></button>
        </span>
      )}
      <span className="vr" /><span className="lab mono" style={{ fontSize: 12 }}>Atalho</span>
      <span className="sc" onClick={last30}>Últimos 30 dias</span>
      {chips && (<>
        <div style={{ flexBasis: '100%' }} />
        {F.cat
          ? <span className="chip fil"><i className="dot" style={{ background: catColor(F.cat) }} />Categoria: {F.cat}<button onClick={() => setF({ cat: '' })}>×</button></span>
          : <select className="chip" value="" onChange={ev => setF({ cat: ev.target.value })}><option value="">Categoria: todas</option>{fin.allCats().map(c => <option key={c}>{c}</option>)}</select>}
        <select className="chip" value={F.est} onChange={ev => setF({ est: ev.target.value })}>
          <option value="">Estabelecimento: todos</option>{EST.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </>)}
    </div>
  )
}
