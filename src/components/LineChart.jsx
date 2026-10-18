import { useEffect, useMemo, useRef, useState } from 'react'
import { add, brl, dm, dt, estName } from '../lib/utils.js'

const L = 64, R = 16, T = 16, B = 36

// Curva suave por interpolação cúbica monotônica (não gera valores abaixo de zero).
function mono(p) {
  const n = p.length, x = p.map(a => a[0]), y = p.map(a => a[1])
  if (n < 2) return `M${x[0]},${y[0]}`
  const d = []; for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]))
  const m = [d[0]]; for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2])
  for (let i = 0; i < n - 1; i++) {
    if (!d[i]) { m[i] = m[i + 1] = 0 } else {
      const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b
      if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i] }
    }
  }
  let s = `M${x[0]},${y[0]}`
  for (let i = 0; i < n - 1; i++) { const h = x[i + 1] - x[i]; s += ` C${x[i] + h / 3},${y[i] + m[i] * h / 3} ${x[i + 1] - h / 3},${y[i + 1] - m[i + 1] * h / 3} ${x[i + 1]},${y[i + 1]}` }
  return s
}

// Gráfico de linha: um ponto por dia com compra. mode: 'dia' ou 'acum'.
export default function LineChart({ byDay, range: r, mode }) {
  const [hov, setHov] = useState(null)
  const wrap = useRef(null)
  const [{ W, H }, setDim] = useState({ W: 580, H: 420 })
  // O gráfico ocupa todo o espaço disponível do cartão, sem sobrar área vazia.
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setDim({ W: Math.max(320, Math.round(e.contentRect.width)), H: Math.max(260, Math.round(e.contentRect.height)) }))
    ro.observe(wrap.current)
    return () => ro.disconnect()
  }, [])
  const g = useMemo(() => {
    const days = Object.keys(byDay).sort()
    if (!days.length) return null
    let c = 0
    const vals = days.map(d => mode === 'dia' ? byDay[d].v : (c += byDay[d].v))
    const max = Math.max(...vals), st = [50, 100, 200, 250, 500, 1000, 2000].find(s => max / s <= 5) || 5000, top = Math.ceil(max / st) * st
    const span = (dt(r[1]) - dt(r[0])) / 864e5 || 1
    const X = d => L + (dt(d) - dt(r[0])) / 864e5 / span * (W - L - R), Y = v => T + (1 - v / top) * (H - T - B)
    const pts = days.map((d, i) => ({ x: X(d), y: Y(vals[i]), d, v: vals[i], n: byDay[d].n }))
    const ticks = [], k = Math.max(1, Math.ceil((span + 1) / 8))
    for (let i = 0; i <= span; i += k) ticks.push({ x: X(add(r[0], i)), t: dm(add(r[0], i)) })
    const grid = []; for (let v = 0; v <= top; v += st) grid.push({ y: Y(v), v })
    return { pts, ticks, grid, y0: Y(0), path: mono(pts.map(a => [a.x, a.y])), peak: pts.reduce((a, b) => b.v > a.v ? b : a) }
  }, [byDay, r, mode, W, H])

  const a = g && (hov && g.pts.find(p => p.d === hov.d) || g.peak)
  const ex = g ? [...new Set(a.n.map(n => estName(n.est)))].join(', ').slice(0, 22) : ''
  const move = e => {
    const b = e.currentTarget.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * W
    setHov(g.pts.reduce((p, q) => Math.abs(q.x - x) < Math.abs(p.x - x) ? q : p))
  }
  const body = !g ? <div className="empty" style={{ margin: 0 }}>Nenhuma compra neste período.<br />Que tal cadastrar uma nota?</div> : (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A6B3E" stopOpacity=".28" /><stop offset="1" stopColor="#4A6B3E" stopOpacity="0" /></linearGradient></defs>
      {g.grid.map(t => (<g key={t.v}><line x1={L} x2={W - R} y1={t.y} y2={t.y} stroke="#d6d2c0" strokeDasharray="3 5" /><text x={L - 10} y={t.y + 4} textAnchor="end" fontSize="14" fill="#6B665A">{t.v ? 'R$ ' + t.v : 0}</text></g>))}
      {g.ticks.map(t => <text key={t.t} x={t.x} y={H - 10} textAnchor="middle" fontSize="14" fill="#6B665A">{t.t}</text>)}
      <path d={`${g.path} L${g.pts.at(-1).x},${g.y0} L${g.pts[0].x},${g.y0}Z`} fill="url(#ga)" />
      <path d={g.path} fill="none" stroke="#2E4429" strokeWidth="2.6" />
      {g.pts.map(p => <circle key={p.d} cx={p.x} cy={p.y} r="4" fill="#F3EFE3" stroke="#2E4429" strokeWidth="2" />)}
      <line x1={a.x} x2={a.x} y1={a.y} y2={364} stroke="#2E4429" strokeDasharray="2 4" />
      <circle cx={a.x} cy={a.y} r="7" fill="#2E4429" stroke="#F3EFE3" strokeWidth="3" />
      <g transform={`translate(${a.x + (a.x > 400 ? -212 : 20)},${Math.max(4, a.y - 6)})`}>
        <rect width="192" height="74" rx="12" fill="#2E4429" />
        <text x="16" y="24" fontSize="12" fill="#cfd8c0">{dm(a.d)}</text>
        <text x="16" y="48" fontSize="20" fontFamily="Fraunces,serif" fontWeight="600" fill="#F3EFE3">{brl(a.v)}</text>
        <text x="16" y="65" fontSize="12" fill="#cfd8c0">{a.n.length} compra{a.n.length > 1 ? 's' : ''} · {ex}</text>
      </g>
      <rect x="0" y="0" width={W} height={H} fill="transparent" onMouseMove={move} onMouseLeave={() => setHov(null)} />
    </svg>
  )
  return <div ref={wrap} style={{ position: 'relative', flex: 1, minHeight: 300, marginTop: 14 }}>{body}</div>
}
