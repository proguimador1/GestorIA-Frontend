import Icon from './Icon.jsx'
import { useApp } from '../store/AppContext.jsx'
import { shiftAnchor } from '../lib/finance.js'
import { dm, dmy } from '../lib/utils.js'
import { EST } from '../data/seed.js'

// Filtros de categoria e estabelecimento no estilo da prancheta: caixas bege com borda marrom.
// Categoria escolhida vira um chip com a cor da categoria e × para limpar. children: itens extras na mesma linha (ex.: busca).
export function Filtros({ children }) {
  const { F, setF, fin, catColor } = useApp()
  return (
    <div className="filtros">
      {F.cat
        ? <span className="filtro on"><i className="dot" style={{ background: catColor(F.cat) }} />Categoria: {F.cat}<button onClick={() => setF({ cat: '' })} aria-label="Limpar categoria" title="Limpar categoria">×</button></span>
        : <select className="filtro" value="" onChange={ev => setF({ cat: ev.target.value })} aria-label="Categoria"><option value="">Categoria: todas</option>{fin.allCats().map(c => <option key={c}>{c}</option>)}</select>}
      <select className="filtro" value={F.est} onChange={ev => setF({ est: ev.target.value })} aria-label="Estabelecimento">
        <option value="">Estabelecimento: todos</option>{EST.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
      {children}
    </div>
  )
}

// Período escolhido por extenso ("PERÍODO · MÊS / De 01/09/2026 a 30/09/2026").
// aba: aba de pasta presa à prancheta de Finanças; sem aba: caixa simples (Notas fiscais).
export function Periodo({ aba }) {
  const { F, fin } = useApp()
  const [s, e] = fin.range()
  const modo = { week: 'Semana', month: 'Mês', custom: 'Personalizado' }[F.mode]
  return (
    <div className={aba ? 'aba-periodo' : 'periodo-box'}>
      <div className="mono">Período · {modo}</div>
      <div className="serif">De {dmy(s)} a {dmy(e)}</div>
    </div>
  )
}

// Barra de período (Semana, Mês, Personalizado com data inicial e final) e, com chips, a linha de filtros.
export default function FilterBar({ chips }) {
  const { F, setF, fin } = useApp()
  const [s, e] = fin.range()
  const mode = m => setF({ mode: m, anchor: m === 'custom' ? F.anchor : F.anchor })
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
      {chips && (<>
        <div style={{ flexBasis: '100%' }} />
        <Filtros />
      </>)}
    </div>
  )
}
