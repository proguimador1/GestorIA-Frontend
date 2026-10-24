import { useNavigate } from 'react-router-dom'
import LineChart from '../components/LineChart.jsx'
import Donut from '../components/Donut.jsx'
import { useApp } from '../store/AppContext.jsx'
import { EST, NAO_ALIM } from '../data/seed.js'
import { brl, dm, estName, pct, sum } from '../lib/utils.js'

export const Delta = ({ a, b }) => b ? <span className={a >= b ? 'up' : 'dn'}>{a >= b ? '▲' : '▼'} {pct(Math.abs(a / b - 1) * 100)}</span> : '—'
// Preposição "a" com a contração correta: ao período anterior, à semana anterior, a julho
const aoA = pl => pl.startsWith('o ') ? 'ao ' + pl.slice(2) : pl.startsWith('a ') ? 'à ' + pl.slice(2) : 'a ' + pl
const Kpi = ({ label, value, sub, hl }) => <div className={'card kpi' + (hl ? ' hl' : '')}><div className="kt">{label}</div><div className="v">{value}</div><div className="s">{sub}</div></div>
const Tog = ({ opts, val, onSel }) => <div className="tog">{opts.map(([k, t]) => <span key={k} className={val === k ? 'on' : ''} onClick={() => onSel(k)}>{t}</span>)}</div>
const Head = ({ title, sub, children }) => (<><div className="ct">{title}</div><div className="cs">{sub}</div>{children && <div style={{ marginTop: 16 }}>{children}</div>}</>)

// Aba "Visão geral": indicadores, evolução, estabelecimentos, categorias e destaques.
export default function Visao() {
  const { F, setF, fin, catColor } = useApp()
  const nav = useNavigate()
  const r = fin.range(), pr = fin.prevRange(), pl = fin.prevLab()
  const it = fin.items(r), tot = sum(it.map(i => i.total)), nn = new Set(it.map(i => i.n.id)).size
  const pit = fin.items(pr), pt = sum(pit.map(i => i.total)), pn = new Set(pit.map(i => i.n.id)).size
  const avg = nn ? tot / nn : 0, pavg = pn ? pt / pn : 0

  const catMap = {}; fin.items(r, { cat: '' }).filter(i => !F.est || i.n.est === F.est).forEach(i => { if (i.cat !== NAO_ALIM) catMap[i.cat] = (catMap[i.cat] || 0) + i.total })
  const naoAlim = sum(fin.items(r, { cat: '' }).filter(i => i.cat === NAO_ALIM && (!F.est || i.n.est === F.est)).map(i => i.total))
  const catD = Object.entries(catMap).sort((a, b) => b[1] - a[1]), cTot = sum(catD.map(c => c[1]))

  const key = F.bar === 'total' ? 't' : 'm'
  const bars = EST.map(e => {
    const ns = fin.notesIn(r, { est: e.id }).filter(n => fin.nTot(n, F.cat)), t = sum(ns.map(n => fin.nTot(n, F.cat)))
    return { e, n: ns.length, t, m: ns.length ? t / ns.length : 0 }
  }).filter(b => b.n).sort((a, b) => b[key] - a[key])
  const bm = Math.max(1, ...bars.map(b => b[key]))

  const pc = {}; fin.items(pr, { cat: '' }).forEach(i => { if (i.cat !== NAO_ALIM) pc[i.cat] = (pc[i.cat] || 0) + i.total })
  const gr = catD.filter(c => pc[c[0]]).map(c => [c[0], c[1] / pc[c[0]] - 1]).sort((a, b) => b[1] - a[1])[0]
  const byDay = fin.byDay(r), top = Object.entries(byDay).sort((a, b) => b[1].v - a[1].v)[0]

  const ins = []
  if (catD[0]) ins.push({ c: catColor(catD[0][0]), t: `${catD[0][0]} é a maior fatia do período: ${pct(catD[0][1] / cTot * 100)} do gasto, ou ${brl(catD[0][1])}.`, l: 'Ver itens', go: () => setF({ cat: catD[0][0] }) })
  if (gr) ins.push({ c: catColor(gr[0]), t: `${gr[0]} ${gr[1] >= 0 ? 'subiu' : 'caiu'} ${pct(Math.abs(gr[1]) * 100)} em relação ${aoA(pl)}.${gr[1] > 0 ? ' É a categoria que mais cresceu.' : ''}`, l: 'Ver itens', go: () => setF({ cat: gr[0] }) })
  if (top) ins.push({ c: '#E3A53A', t: `O dia mais caro foi ${dm(top[0])}: ${brl(top[1].v)} ${top[1].n.length === 1 ? 'em uma única compra, no ' + estName(top[1].n[0].est) : 'em ' + top[1].n.length + ' compras'}.`, l: 'Ver nota', go: () => { setF({ open: top[1].n[0].id }); nav('/notas') } })
  const cmp = `${dm(pr[0])} a ${dm(pr[1])}`

  return (
    <>
      <div className="row mt">
        <Kpi hl label="Total gasto no período" value={brl(tot)} sub={`${new Set(it.map(i => i.n.est)).size} estabelecimentos · ${fin.lab()}`} />
        <Kpi label="Variação do gasto" value={<Delta a={tot} b={pt} />} sub={pt ? `contra ${pl} (${cmp}): ${brl(pt)}` : `sem dados em ${cmp}`} />
        <Kpi label="Compras registradas" value={nn} sub={pn ? `${nn === pn ? 'igual ' + aoA(pl) : (nn > pn ? '▲ ' + (nn - pn) + ' a mais que ' : '▼ ' + (pn - nn) + ' a menos que ') + pl} (${pn})` : `sem dados em ${cmp}`} />
        <Kpi label="Valor médio por compra" value={brl(avg)} sub={pavg ? <><Delta a={avg} b={pavg} /> contra {pl} ({brl(pavg)})</> : `sem dados em ${cmp}`} />
      </div>

      {/* Grade 2 x 2: cada linha tem células da mesma altura (Evolução x Estabelecimento; Atenção x Categoria) */}
      <div className="vgrid mt">
        <div className="card">
          <Head title="Evolução dos gastos" sub="Quanto você gastou em cada dia com compra, em R$">
            <Tog opts={[['dia', 'Por dia'], ['acum', 'Soma acumulada']]} val={F.line} onSel={v => setF({ line: v })} />
          </Head>
          <LineChart byDay={byDay} range={r} mode={F.line} />
        </div>

        <div className="card">
          <Head title="Total gasto por estabelecimento" sub="Quanto foi gasto em cada mercado e a média por compra">
            <Tog opts={[['total', 'Total'], ['media', 'Média por compra']]} val={F.bar} onSel={v => setF({ bar: v })} />
          </Head>
          <div className="scr" style={{ maxHeight: bars.length > 3 ? 330 : 'none', paddingRight: 12, marginTop: 20 }}>
            {bars.map(b => (
              <div key={b.e.id} className="hov" onClick={() => setF({ est: F.est === b.e.id ? '' : b.e.id })} style={{ marginBottom: 20, opacity: F.est && F.est !== b.e.id ? .45 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}><b style={{ fontSize: 17 }}>{b.e.name}</b><span className="serif" style={{ fontWeight: 600, fontSize: 20 }}>{brl(b[key])}</span></div>
                <div style={{ height: 16, borderRadius: 8, background: '#e5e1d0', marginTop: 8 }}><div style={{ height: 16, borderRadius: 8, width: (b[key] / bm * 100) + '%', background: 'var(--g)' }} /></div>
                <div className="lab" style={{ fontSize: 14, marginTop: 7 }}>{b.n} compra{b.n > 1 ? 's' : ''} {fin.phrase()} · {brl(b.m)} por compra</div>
              </div>
            ))}
            {!bars.length && <div className="lab">Sem compras no período.</div>}
          </div>
        </div>

        <div className="card">
          <Head title="O que chamou atenção" sub="Destaques calculados a partir das suas notas" />
          <div className="ins-list">
            {ins.map((i, k) => <div key={k} className="ins"><i className="dot" style={{ background: i.c }} /><p>{i.t}<small onClick={i.go}>{i.l}</small></p></div>)}
            {!ins.length && <span className="lab">Cadastre notas para ver destaques.</span>}
          </div>
        </div>

        <div className="card">
          <Head title="Consumo por categoria alimentar" sub="Quanto cada categoria representa do total gasto" />
          {catD.length ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 20 }}>
              <div style={{ flex: 'none' }}><Donut data={catD} tot={cTot} sel={F.cat} color={catColor} onSel={v => setF({ cat: v })} /></div>
              <div className="leg scr" style={{ flex: 1, minWidth: 0 }}>
                {catD.map(([c, v]) => (
                  <div key={c} className="legrow" onClick={() => setF({ cat: F.cat === c ? '' : c })}>
                    <i className="dot" style={{ background: catColor(c) }} /><span title={c}>{c}</span><b>{pct(v / cTot * 100)}</b><span className="lab" style={{ textAlign: 'right' }}>{brl(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="lab" style={{ marginTop: 20 }}>Sem dados.</div>}
          {naoAlim > 0 && <div className="lab" style={{ fontSize: 14, marginTop: 16 }}>Itens não alimentícios ({brl(naoAlim)}) não entram neste gráfico.</div>}
        </div>
      </div>
    </>
  )
}
