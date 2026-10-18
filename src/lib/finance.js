// Regras de negócio: períodos, filtros, totais e linhas da planilha.
// createFinance(S, F) devolve funções já ligadas aos dados (S) e aos filtros (F) atuais.
import { add, dt, iso, dm, dmy, MES, sum, today, estName } from './utils.js'

export function createFinance(S, F) {
  const range = (m = F.mode, a = F.anchor) => {
    if (m === 'custom') return F.from <= F.to ? [F.from, F.to] : [F.to, F.from]
    if (m === 'week') { const d = dt(a), w = (d.getUTCDay() + 6) % 7, s = add(a, -w); return [s, add(s, 6)] }
    if (m === '30') return [add(a, -29), a]
    const d = dt(a), y = d.getUTCFullYear(), mo = d.getUTCMonth()
    return [iso(new Date(Date.UTC(y, mo, 1))), iso(new Date(Date.UTC(y, mo + 1, 0)))]
  }
  // Período anterior: mesma quantidade de dias, imediatamente antes do período atual.
  const prevRange = () => {
    const [s, e] = range(), n = Math.round((dt(e) - dt(s)) / 864e5) + 1
    return [add(s, -n), add(s, -1)]
  }
  const lab = () => { const [s, e] = range(); return F.mode === 'month' ? MES[+s.slice(5, 7) - 1] + ' ' + s.slice(0, 4) : dm(s) + ' – ' + dm(e) }
  const prevLab = () => {
    const [ps, pe] = prevRange()
    if (F.mode === 'month') { const m = range('month', add(range()[0], -1)); if (m[0] === ps && m[1] === pe) return MES[+ps.slice(5, 7) - 1] }
    return F.mode === 'week' ? 'a semana anterior' : 'o período anterior'
  }
  const phrase = () => {
    const [s] = range(), [ts] = range(F.mode, today())
    return F.mode === 'month' ? (s === ts ? 'este mês' : 'em ' + MES[+s.slice(5, 7) - 1])
      : F.mode === 'week' ? (s === ts ? 'esta semana' : 'na semana de ' + dm(s)) : 'neste período'
  }
  const notesIn = (r, o = {}) => S.notes.filter(n => n.date >= r[0] && n.date <= r[1] &&
    (o.est === undefined ? !F.est || n.est === F.est : !o.est || n.est === o.est))
  const items = (r, o = {}) => {
    const c = o.cat === undefined ? F.cat : o.cat
    return notesIn(r, o).flatMap(n => n.items.filter(i => !c || i.cat === c).map(i => ({ ...i, n })))
  }
  const nTot = (n, c) => sum(n.items.filter(i => !c || i.cat === c).map(i => i.total))
  const byDay = r => {
    const m = {}
    notesIn(r).forEach(n => { const t = nTot(n, F.cat); if (t) { (m[n.date] = m[n.date] || { v: 0, n: [] }); m[n.date].v += t; m[n.date].n.push(n) } })
    return m
  }
  const allCats = () => [...new Set(S.notes.flatMap(n => n.items.map(i => i.cat)))]
  const sheetRows = () => items(range()).sort((a, b) => a.n.date < b.n.date ? -1 : 1)
    .map(i => [dmy(i.n.date), estName(i.n.est), i.name, i.cat, i.qty, i.unit, i.unitPrice, i.total])
  return { range, prevRange, lab, prevLab, phrase, notesIn, items, nTot, byDay, allCats, sheetRows }
}

// Nova data de referência ao usar as setas do período.
export function shiftAnchor(F, n) {
  if (F.mode === 'month') { const d = dt(F.anchor); d.setUTCMonth(d.getUTCMonth() + n); return iso(d) }
  return add(F.anchor, n * (F.mode === 'week' ? 7 : 30))
}

