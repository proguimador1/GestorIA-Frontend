// Respostas do chatbot por regras e consultas aos dados (sem modelo de linguagem).
// Trechos entre ** ** são exibidos em negrito pela tela do chatbot.
import { add, brl, dm, dmy, estName, norm, pct, sum, today } from './utils.js'

export const SUG = ['Quanto gastei este mês?', 'Quanto gastei esta semana?', 'Gasto por categoria', 'Onde gastei mais?', 'Qual foi a última compra?', 'Onde comprar tomate mais barato?']

const B = x => `**${x}**`

function chatRange(n, fin) {
  if (/semana/.test(n)) return [fin.range('week', today()), 'esta semana']
  if (/passad|anterior/.test(n)) { const m = fin.range('month', today()); return [fin.range('month', add(m[0], -1)), 'no mês passado'] }
  return [fin.range('month', today()), 'este mês']
}

export function chatAnswer(q, S, fin) {
  const n = norm(q), [r, lb] = chatRange(n, fin)
  const ns = fin.notesIn(r, { est: '' }), its = fin.items(r, { cat: '', est: '' }), tot = sum(its.map(i => i.total))
  if (/ultim/.test(n)) {
    const l = [...S.notes].sort((a, b) => a.date < b.date ? 1 : -1)[0]
    return l ? `A última nota é de ${B(dmy(l.date))} no ${B(estName(l.est))}: ${l.items.length} itens, ${B(brl(l.total))}.` : 'Ainda não há notas cadastradas.'
  }
  const names = [...new Set(S.notes.flatMap(x => x.items.map(i => i.name)))]
  const m = names.find(x => n.includes(norm(x))) || names.find(x => n.includes(norm(x.split(' ')[0])))
  if (m && /barat|onde|preco|custa|caro/.test(n)) {
    const p = {}
    S.notes.slice().sort((a, b) => a.date < b.date ? -1 : 1).forEach(x => x.items.filter(i => i.name === m).forEach(i => { p[x.est] = i.unitPrice }))
    const l = Object.entries(p).sort((a, b) => a[1] - b[1])
    return l.length ? `${B(m)}: último preço em cada lugar: ${l.map(a => estName(a[0]) + ' ' + brl(a[1])).join(' · ')}. O mais barato é ${B(estName(l[0][0]))}.` : 'Não encontrei esse item.'
  }
  if (!ns.length) return `Não encontrei compras ${lb}.`
  if (/categoria|tipo/.test(n)) {
    const c = {}; its.forEach(i => { c[i.cat] = (c[i.cat] || 0) + i.total })
    return `Gasto por categoria ${lb}: ` + Object.entries(c).sort((a, b) => b[1] - a[1]).map(a => `${a[0]} ${B(brl(a[1]))} (${pct(a[1] / tot * 100)})`).join(' · ') + '.'
  }
  if (/onde|mercado|estabelec|loja/.test(n)) {
    const e = {}; ns.forEach(x => { e[x.est] = (e[x.est] || 0) + x.total })
    const l = Object.entries(e).sort((a, b) => b[1] - a[1])
    return `Você gastou mais no ${B(estName(l[0][0]))} ${lb}: ${B(brl(l[0][1]))}. ` + l.slice(1).map(a => estName(a[0]) + ' ' + brl(a[1])).join(' · ')
  }
  if (/caro|maior/.test(n)) {
    const d = Object.entries(fin.byDay(r)).sort((a, b) => b[1].v - a[1].v)[0]
    return `O dia mais caro ${lb} foi ${B(dm(d[0]))}: ${B(brl(d[1].v))}.`
  }
  if (/quant(a|o)s/.test(n) && /nota|compra/.test(n)) return `Foram ${B(ns.length)} compras ${lb}, com ${B(sum(ns.map(x => x.items.length)))} itens.`
  if (/gast|total|paguei|custou/.test(n)) return `Você gastou ${B(brl(tot))} ${lb}, em ${ns.length} compras (média de ${brl(tot / ns.length)} por compra).`
  return 'Ainda não entendi. Posso responder sobre: gasto total (semana ou mês), gasto por categoria, onde você gastou mais, última compra, dia mais caro e onde comprar um item mais barato.'
}
