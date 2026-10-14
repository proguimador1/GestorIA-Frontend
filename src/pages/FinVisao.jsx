import { useNavigate } from 'react-router-dom'
import LineChart from '../components/LineChart.jsx'
import Donut, { col } from '../components/Donut.jsx'
import { useApp } from '../store/AppContext.jsx'
import { EST } from '../data/seed.js'
import { brl, dm, estName, pct, sum } from '../lib/utils.js'

export const Delta = ({ a, b }) => b ? <span className={a >= b ? 'up' : 'dn'}>{a >= b ? '▲' : '▼'} {pct(Math.abs(a / b - 1) * 100)}</span> : '—'
const Kpi = ({ label, value, sub, hl }) => <div className={'card kpi' + (hl ? ' hl' : '')}><div className="mono lab">{label}</div><div className="v">{value}</div><div className="s">{sub}</div></div>
const Tog = ({ opts, val, onSel }) => <div className="tog">{opts.map(([k, t]) => <span key={k} className={val === k ? 'on' : ''} onClick={() => onSel(k)}>{t}</span>)}</div>

// Aba "Visão geral": indicadores, evolução, estabelecimentos, categorias e destaques.
export default function Visao() {
  const { F, setF, fin } = useApp()
  const nav = useNavigate()
  const r = fin.range(), pr = fin.prevRange(), pl = fin.prevLab()
  const it = fin.items(r), tot = sum(it.map(i => i.total)), nn = new Set(it.map(i => i.n.id)).size
  const pit = fin.items(pr), pt = sum(pit.map(i => i.total)), pn = new Set(pit.map(i => i.n.id)).size
  const avg = nn ? tot / nn : 0, pavg = pn ? pt / pn : 0

  const catMap = {}; fin.items(r, { cat: '' }).filter(i => !F.est || i.n.est === F.est).forEach(i => { catMap[i.cat] = (catMap[i.cat] || 0) + i.total })
  const catD = Object.entries(catMap).sort((a, b) => b[1] - a[1]), cTot = sum(catD.map(c => c[1]))

  const key = F.bar === 'total' ? 't' : 'm'
  const bars = EST.map(e => {
    const ns = fin.notesIn(r, { est: e.id }).filter(n => fin.nTot(n, F.cat)), t = sum(ns.map(n => fin.nTot(n, F.cat)))
    return { e, n: ns.length, t, m: ns.length ? t / ns.length : 0 }
  }).filter(b => b.n).sort((a, b) => b[key] - a[key])
  const bm = Math.max(1, ...bars.map(b => b[key]))

  const pc = {}; fin.items(pr, { cat: '' }).forEach(i => { pc[i.cat] = (pc[i.cat] || 0) + i.total })
  const gr = catD.filter(c => pc[c[0]]).map(c => [c[0], c[1] / pc[c[0]] - 1]).sort((a, b) => b[1] - a[1])[0]
  const byDay = fin.byDay(r), top = Object.entries(byDay).sort((a, b) => b[1].v - a[1].v)[0]

  const ins = []
  if (catD[0]) ins.push({ c: col(catD[0][0]), t: `${catD[0][0]} é a maior fatia do período: ${pct(catD[0][1] / cTot * 100)} do gasto, ou ${brl(catD[0][1])}.`, l: 'Ver itens', go: () => setF({ cat: catD[0][0] }) })
  if (gr) ins.push({ c: col(gr[0]), t: `${gr[0]} ${gr[1] >= 0 ? 'subiu' : 'caiu'} ${pct(Math.abs(gr[1]) * 100)} em relação a ${pl}.${gr[1] > 0 ? ' É a categoria que mais cresceu.' : ''}`, l: 'Ver itens', go: () => setF({ cat: gr[0] }) })
  if (top) ins.push({ c: '#E3A53A', t: `O dia mais caro foi ${dm(top[0])}: ${brl(top[1].v)} ${top[1].n.length === 1 ? 'em uma única compra, no ' + estName(top[1].n[0].est) : 'em ' + top[1].n.length + ' compras'}.`, l: 'Ver nota', go: () => { setF({ open: top[1].n[0].id }); nav('/notas') } })

  return (
    <>
      <div className="row mt">
        <Kpi hl label="Total do período" value={brl(tot)} sub={`${new Set(it.map(i => i.n.est)).size} estabelecimentos · ${fin.lab()}`} />
        <Kpi label={'Contra ' + pl} value={<Delta a={tot} b={pt} />} sub={pt ? 'anterior: ' + brl(pt) : 'sem dados anteriores'} />
        <Kpi label="Compras registradas" value={nn} sub={pn ? (nn >= pn ? '▲ ' + (nn - pn) + ' a mais' : '▼ ' + (pn - nn) + ' a menos') + ' que em ' + pl : '—'} />
        <Kpi label="Valor médio por compra" value={brl(avg)} sub={pavg ? <><Delta a={avg} b={pavg} /> contra {pl}</> : '—'} />
      </div>

      <div className="row mt" style={{ alignItems: 'stretch' }}>
        <div className="card" style={{ width: 640, flex: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div><div className="mono lab">Evolução de gastos</div><div className="lab" style={{ fontSize: 13, marginTop: 8, fontFamily: "'Instrument Sans'" }}>Cada ponto é um dia com compra · valores em R$</div></div>
            <Tog opts={[['dia', 'Por dia'], ['acum', 'Soma acumulada']]} val={F.line} onSel={v => setF({ line: v })} />
          </div>
          <LineChart byDay={byDay} range={r} mode={F.line} />
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 10 }}>
              <div className="mono lab">Total por estabelecimento</div>
              <Tog opts={[['total', 'Total'], ['media', 'Média por compra']]} val={F.bar} onSel={v => setF({ bar: v })} />
            </div>
            <div className="scr" style={{ maxHeight: bars.length > 3 ? 330 : 'none', paddingRight: 12 }}>
              {bars.map(b => (
                <div key={b.e.id} className="hov" onClick={() => setF({ est: F.est === b.e.id ? '' : b.e.id })} style={{ marginBottom: 20, opacity: F.est && F.est !== b.e.id ? .45 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><b style={{ fontSize: 15 }}>{b.e.name}</b><span className="serif" style={{ fontWeight: 600, fontSize: 19 }}>{brl(b[key])}</span></div>
                  <div style={{ height: 16, borderRadius: 8, background: '#e5e1d0', marginTop: 8 }}><div style={{ height: 16, borderRadius: 8, width: (b[key] / bm * 100) + '%', background: 'var(--g)' }} /></div>
                  <div className="lab" style={{ fontSize: 12, marginTop: 7 }}>{b.n} compra{b.n > 1 ? 's' : ''} {fin.phrase()} · {brl(b.m)} por compra</div>
                </div>
              ))}
              {!bars.length && <div className="lab">Sem compras no período.</div>}
            </div>
          </div>

          <div className="card" style={{ flex: 1 }}>
            <div className="mono lab" style={{ marginBottom: 8 }}>Consumo por categoria alimentar</div>
            {catD.length ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
                <div style={{ flex: 'none' }}><Donut data={catD} tot={cTot} sel={F.cat} onSel={v => setF({ cat: v })} /></div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  {catD.map(([c, v]) => (
                    <div key={c} className="hov" onClick={() => setF({ cat: F.cat === c ? '' : c })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderTop: '1px solid var(--line)' }}>
                      <i className="dot" style={{ background: col(c) }} /><span style={{ flex: 1, fontWeight: 500 }}>{c}</span><b style={{ width: 42 }}>{pct(v / cTot * 100)}</b><span className="lab" style={{ width: 88, textAlign: 'right' }}>{brl(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="lab">Sem dados.</div>}
          </div>
        </div>
      </div>

      <div className="card mt">
        <div className="mono lab" style={{ marginBottom: 20 }}>O que chamou atenção · {fin.lab()}</div>
        <div className="row" style={{ gap: 36 }}>
          {ins.map((i, k) => <div key={k} className="ins"><i className="dot" style={{ background: i.c }} /><p>{i.t}<small onClick={i.go}>{i.l}</small></p></div>)}
          {!ins.length && <span className="lab">Cadastre notas para ver destaques.</span>}
        </div>
      </div>
    </>
  )
}
