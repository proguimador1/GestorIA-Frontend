import { brl } from '../lib/utils.js'


// Rosca de categorias. data: [[categoria, valor]]; sel: categoria selecionada; onSel: troca a seleção.
export default function Donut({ data, tot, sel, onSel, color, size = 180 }) {
  const r = 70, C = 2 * Math.PI * r
  let o = 0
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      {data.map(([c, v]) => {
        const p = v / tot, off = o; o += C * p
        return <circle key={c} onClick={() => onSel(sel === c ? '' : c)} style={{ cursor: 'pointer', opacity: sel && sel !== c ? .35 : 1 }}
          cx="100" cy="100" r={r} fill="none" stroke={color(c)} strokeWidth="30" strokeDasharray={`${Math.max(0, C * p - 3)} ${C}`} strokeDashoffset={-off} transform="rotate(-90 100 100)" />
      })}
      <text x="100" y="94" textAnchor="middle" fontSize="14" fill="#6B665A">Total</text>
      <text x="100" y="118" textAnchor="middle" fontSize="17" fontFamily="Fraunces,serif" fontWeight="600">{brl(tot)}</text>
    </svg>
  )
}
