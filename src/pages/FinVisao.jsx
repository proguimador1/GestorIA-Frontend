import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LineChart from '../components/LineChart.jsx'
import Donut from '../components/Donut.jsx'
import StatusDados from '../components/StatusDados.jsx'
import { useApp } from '../store/AppContext.jsx'
import { dashboard } from '../services/gestoria.js'
import { MES, brl, dm, dt, estName, iso, pct, sum } from '../lib/utils.js'

export const Delta = ({ a, b }) => b ? <span className={a >= b ? 'up' : 'dn'}>{a >= b ? '▲' : '▼'} {pct(Math.abs(a / b - 1) * 100)}</span> : '—'
// Preposição "a" com a contração correta: ao período anterior, à semana anterior, a julho
const aoA = pl => pl.startsWith('o ') ? 'ao ' + pl.slice(2) : pl.startsWith('a ') ? 'à ' + pl.slice(2) : 'a ' + pl
const Kpi = ({ label, value, sub, hl }) => <div className={'card kpi' + (hl ? ' hl' : '')}><div className="kt">{label}</div><div className="v">{value}</div><div className="s">{sub}</div></div>
const Tog = ({ opts, val, onSel }) => <div className="tog">{opts.map(([k, t]) => <span key={k} className={val === k ? 'on' : ''} onClick={() => onSel(k)}>{t}</span>)}</div>
const Head = ({ title, sub, children }) => (<><div className="ct">{title}</div><div className="cs">{sub}</div>{children && <div style={{ marginTop: 16 }}>{children}</div>}</>)
const num = v => Number(v) || 0

// Os 6 meses que terminam no mês de "fim" (AAAA-MM).
function ultimosMeses(fim, n = 6) {
  const d = dt(fim), y = d.getUTCFullYear(), m = d.getUTCMonth()
  return Array.from({ length: n }, (_, k) => iso(new Date(Date.UTC(y, m - (n - 1) + k, 1))).slice(0, 7))
}

// Gasto com alimentos por mês (campo por_mes do GET /api/dashboard/), nos últimos 6 meses do período.
function GastoPorMes({ fim }) {
  const { versao, mock } = useApp()
  const meses = ultimosMeses(fim)
  const chave = meses[0] + '|' + fim
  const [res, setRes] = useState({ chave: '', valores: null, erro: null })
  useEffect(() => {
    if (mock) return
    let vivo = true
    dashboard({ inicio: meses[0] + '-01', fim })
      .then(d => vivo && setRes({ chave, valores: Object.fromEntries((d.por_mes || []).map(x => [x.mes, num(x.total)])), erro: null }))
      .catch(e => vivo && setRes({ chave, valores: null, erro: e.userMessage || 'Não foi possível carregar.' }))
    return () => { vivo = false }
  }, [chave, versao, mock])
  if (res.chave !== chave) return <div className="lab" style={{ marginTop: 20 }}>Carregando…</div>
  if (res.erro) return <div className="lab" style={{ marginTop: 20 }}>{res.erro}</div>
  const linhas = meses.map(m => ({ m, v: res.valores[m] || 0 }))
  const max = Math.max(1, ...linhas.map(l => l.v))
  return (
    <div style={{ marginTop: 20 }}>
      {linhas.map(({ m, v }) => (
        <div key={m} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}><b style={{ fontSize: 16, textTransform: 'capitalize' }}>{MES[+m.slice(5) - 1]} {m.slice(0, 4)}</b><span className="serif" style={{ fontWeight: 600, fontSize: 18 }}>{brl(v)}</span></div>
          <div style={{ height: 14, borderRadius: 7, background: '#e5e1d0', marginTop: 6 }}><div style={{ height: 14, borderRadius: 7, width: (v / max * 100) + '%', background: 'var(--g)' }} /></div>
        </div>
      ))}
      <div className="lab" style={{ fontSize: 14 }}>Total dos 6 meses: {brl(sum(linhas.map(l => l.v)))} · sem filtro de categoria ou estabelecimento</div>
    </div>
  )
}

// Aba "Visão geral": indicadores, evolução, estabelecimentos, categorias e destaques.
// Sem filtro de categoria/estabelecimento, os totais e a rosca vêm do GET /api/dashboard/;
// com filtro, são calculados a partir das notas (GET /api/notas/ e /api/notas/<chave>/).
export default function Visao() {
  const { F, setF, fin, catColor, ests, dashAtual, dashAnterior } = useApp()
  const nav = useNavigate()
  const r = fin.range(), pr = fin.prevRange(), pl = fin.prevLab()
  const it = fin.items(r), pit = fin.items(pr)
  const usarDash = !F.cat && !F.est && dashAtual && dashAnterior
  const tot = usarDash ? num(dashAtual.total_alimentos) : sum(it.map(i => i.total))
  const nn = usarDash ? dashAtual.qtd_notas : new Set(it.map(i => i.n.id)).size
  const pt = usarDash ? num(dashAnterior.total_alimentos) : sum(pit.map(i => i.total))
  const pn = usarDash ? dashAnterior.qtd_notas : new Set(pit.map(i => i.n.id)).size
  const avg = nn ? tot / nn : 0, pavg = pn ? pt / pn : 0
  const nEst = new Set(fin.notesIn(r).map(n => n.est)).size
  // Itens não alimentícios não são salvos: só aparecem na diferença entre o total dos cupons e o gasto com alimentos.
  const outrosCupom = usarDash ? Math.max(0, num(dashAtual.total_cupons) - num(dashAtual.total_alimentos)) : 0

  const porCategoria = (lista, itens) => {
    if (!F.est && lista) return lista.map(c => [c.categoria, num(c.total)])
    const m = {}; itens.forEach(i => { m[i.cat] = (m[i.cat] || 0) + i.total })
    return Object.entries(m)
  }
  const catD = porCategoria(dashAtual?.por_categoria, fin.items(r, { cat: '' })).filter(c => c[1] > 0).sort((a, b) => b[1] - a[1])
  const cTot = sum(catD.map(c => c[1]))
  const pc = Object.fromEntries(porCategoria(dashAnterior?.por_categoria, fin.items(pr, { cat: '' })))

  const key = F.bar === 'total' ? 't' : 'm'
  const bars = ests.map(e => {
    const ns = fin.notesIn(r, { est: e.id }).filter(n => fin.nTot(n, F.cat)), t = sum(ns.map(n => fin.nTot(n, F.cat)))
    return { e, n: ns.length, t, m: ns.length ? t / ns.length : 0 }
  }).filter(b => b.n).sort((a, b) => b[key] - a[key])
  const bm = Math.max(1, ...bars.map(b => b[key]))

  const gr = catD.filter(c => pc[c[0]]).map(c => [c[0], c[1] / pc[c[0]] - 1]).sort((a, b) => b[1] - a[1])[0]
  const byDay = fin.byDay(r), top = Object.entries(byDay).sort((a, b) => b[1].v - a[1].v)[0]

  const ins = []
  if (catD[0]) ins.push({ c: catColor(catD[0][0]), t: `${catD[0][0]} é a maior fatia do período: ${pct(catD[0][1] / cTot * 100)} do gasto, ou ${brl(catD[0][1])}.`, l: 'Ver itens', go: () => setF({ cat: catD[0][0] }) })
  if (gr) ins.push({ c: catColor(gr[0]), t: `${gr[0]} ${gr[1] >= 0 ? 'subiu' : 'caiu'} ${pct(Math.abs(gr[1]) * 100)} em relação ${aoA(pl)}.${gr[1] > 0 ? ' É a categoria que mais cresceu.' : ''}`, l: 'Ver itens', go: () => setF({ cat: gr[0] }) })
  if (top) ins.push({ c: '#E3A53A', t: `O dia mais caro foi ${dm(top[0])}: ${brl(top[1].v)} ${top[1].n.length === 1 ? 'em uma única compra, no ' + estName(top[1].n[0].est) : 'em ' + top[1].n.length + ' compras'}.`, l: 'Ver nota', go: () => { setF({ open: top[1].n[0].id }); nav('/notas') } })
  const cmp = `${dm(pr[0])} a ${dm(pr[1])}`

  return (
    <>
      <StatusDados />
      <div className="row mt">
        <Kpi hl label="Gasto com alimentos" value={brl(tot)} sub={`${nEst} estabelecimento${nEst === 1 ? '' : 's'} · ${fin.lab()}${usarDash ? ` · cupons: ${brl(num(dashAtual.total_cupons))}` : ''}`} />
        <Kpi label="Variação do gasto" value={<Delta a={tot} b={pt} />} sub={pt ? `contra ${pl} (${cmp}): ${brl(pt)}` : `sem dados em ${cmp}`} />
        <Kpi label="Compras registradas" value={nn} sub={pn ? `${nn === pn ? 'igual ' + aoA(pl) : (nn > pn ? '▲ ' + (nn - pn) + ' a mais que ' : '▼ ' + (pn - nn) + ' a menos que ') + pl} (${pn})` : `sem dados em ${cmp}`} />
        <Kpi label="Valor médio por compra" value={brl(avg)} sub={pavg ? <><Delta a={avg} b={pavg} /> contra {pl} ({brl(pavg)})</> : `sem dados em ${cmp}`} />
      </div>

      {/* Grade 2 x 2: cada linha tem células da mesma altura (Evolução x Estabelecimento; Atenção x Categoria) */}
      <div className="vgrid mt">
        <div className="card">
          <Head title="Evolução dos gastos" sub={F.line === 'mes' ? 'Gasto com alimentos em cada mês, em R$' : 'Quanto você gastou em cada dia com compra, em R$'}>
            <Tog opts={[['dia', 'Por dia'], ['acum', 'Soma acumulada'], ['mes', 'Por mês']]} val={F.line} onSel={v => setF({ line: v })} />
          </Head>
          {F.line === 'mes' ? <GastoPorMes fim={r[1]} /> : <LineChart byDay={byDay} range={r} mode={F.line} />}
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
          <Head title="Consumo por categoria alimentar" sub="Quanto cada categoria representa do gasto com alimentos" />
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
          {outrosCupom > 0.005 && <div className="lab" style={{ fontSize: 14, marginTop: 16 }}>{brl(outrosCupom)} dos cupons deste período são de itens não alimentícios, que não são salvos nem entram neste gráfico.</div>}
        </div>
      </div>
    </>
  )
}
