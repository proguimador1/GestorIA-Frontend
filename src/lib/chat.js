// Motor do chatbot GestorIA: regras e consultas às notas fiscais (React + JavaScript, sem serviço externo).
// Escopo único: análise financeira do consumo alimentar do usuário, relatórios por período e planejamento para economizar.
// Nunca inventa dados: quando falta informação, a resposta diz o que faltou.
//
// Formato do texto devolvido (desenhado pela tela do chatbot, sem HTML):
//   ### título   · - item de lista   · 1. item numerado   · > observação   · **negrito**
import { NAO_ALIM } from '../data/seed.js'
import { add, brl, dmy, dt, estName, iso, MES, norm, pct, sum, today } from './utils.js'

export const WELCOME =
  'Olá! Eu sou o **GestorIA**, o assistente financeiro das suas compras de alimentos.\n' +
  'Eu analiso as notas fiscais registradas no app (todo o histórico, não só o mês atual) e respondo com números reais:\n' +
  '- quanto você gastou em um período, por categoria ou por produto;\n' +
  '- em qual supermercado você gastou mais e qual foi o mais vantajoso;\n' +
  '- **relatórios** de qualquer intervalo de datas;\n' +
  '- um **plano para economizar**, com base nos preços que você já pagou.\n' +
  'Escolha uma sugestão abaixo ou escreva sua pergunta.'

// Sugestões da barra de mensagens. "Gerar relatório" abre a escolha do intervalo de datas na tela.
export const SUG = ['Gerar relatório', 'Quanto gastei este mês?', 'Quanto gastei esta semana?', 'Gasto por categoria', 'Onde gastei mais?', 'Qual foi a última compra?', 'Onde comprar leite integral mais barato?', 'Como posso economizar?']

const B = x => `**${x}**`
const r2 = v => Math.round(v * 100) / 100
const compras = k => `${k} ${k === 1 ? 'compra' : 'compras'}`
const dias = ([s, e]) => Math.round((dt(e) - dt(s)) / 864e5) + 1
const faixa = ([s, e]) => s === e ? dmy(s) : `${dmy(s)} a ${dmy(e)}`

// ---------- Períodos ----------
const MES_N = MES.map(norm)
const mesRange = (y, m) => [iso(new Date(Date.UTC(y, m, 1))), iso(new Date(Date.UTC(y, m + 1, 0)))]
// Nome curto de um intervalo, para títulos: mês inteiro vira "setembro 2026"
const nomeFaixa = r => { const [y, m] = [+r[0].slice(0, 4), +r[0].slice(5, 7) - 1], mr = mesRange(y, m); return mr[0] === r[0] && mr[1] === r[1] ? `${MES[m]} ${y}` : faixa(r) }
const semanaDe = a => { const w = (dt(a).getUTCDay() + 6) % 7, s = add(a, -w); return [s, add(s, 6)] }

// Lê o período citado na pergunta. Devolve { r: [início, fim], label } ou null se nenhum período foi citado.
export function lerPeriodo(n) {
  const hoje = today(), y = +hoje.slice(0, 4), mo = +hoje.slice(5, 7) - 1

  // Datas escritas: 01/08 a 15/08, 01/08/2026 até 15/09/2026
  const ds = [...n.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g)].map(m => {
    let ano = m[3] ? +m[3] : y; if (ano < 100) ano += 2000
    let d = iso(new Date(Date.UTC(ano, +m[2] - 1, +m[1])))
    if (!m[3] && d > hoje) d = iso(new Date(Date.UTC(ano - 1, +m[2] - 1, +m[1])))
    return d
  })
  if (ds.length >= 2) { const r = [ds[0], ds[1]].sort(); return { r, label: 'de ' + faixa(r) } }
  if (ds.length === 1) return /desde|a partir/.test(n) ? { r: [ds[0], hoje], label: 'desde ' + dmy(ds[0]) } : { r: [ds[0], ds[0]], label: 'em ' + dmy(ds[0]) }

  if (/\bhoje\b/.test(n)) return { r: [hoje, hoje], label: 'hoje' }
  if (/\bontem\b/.test(n)) { const d = add(hoje, -1); return { r: [d, d], label: 'ontem' } }
  let m = n.match(/ultim[oa]s?\s+(\d+)\s+(dia|semana|mes|meses)/)
  if (m) { const k = +m[1], d = m[2].startsWith('dia') ? k : m[2].startsWith('semana') ? k * 7 : k * 30; return { r: [add(hoje, -(d - 1)), hoje], label: `nos últimos ${k} ${m[2].startsWith('dia') ? 'dias' : m[2].startsWith('semana') ? 'semanas' : 'meses'}` } }
  if (/semana (passada|anterior)/.test(n)) return { r: semanaDe(add(hoje, -7)), label: 'na semana passada' }
  if (/semana/.test(n)) return { r: semanaDe(hoje), label: 'esta semana' }
  if (/mes (passado|anterior)/.test(n)) { const r = mesRange(y, mo - 1); return { r, label: `no mês passado (${MES[+r[0].slice(5, 7) - 1]})` } }
  if (/(este|esse|neste|nesse|deste|desse) mes|mes atual/.test(n)) return { r: mesRange(y, mo), label: 'este mês' }

  // Nome do mês, com ou sem ano: "setembro", "agosto de 2025"
  const iMes = MES_N.findIndex(x => new RegExp(`\\b${x}\\b`).test(n))
  const ano = n.match(/\b(20\d{2})\b/)
  if (iMes >= 0) {
    let a = ano ? +ano[1] : y
    if (!ano && iMes > mo) a-- // mês ainda não chegou neste ano: o mais recente é o do ano passado
    return { r: mesRange(a, iMes), label: `em ${MES[iMes]} de ${a}` }
  }
  if (/ano passado/.test(n)) return { r: [`${y - 1}-01-01`, `${y - 1}-12-31`], label: `em ${y - 1}` }
  if (/(este|esse|neste|nesse) ano/.test(n)) return { r: [`${y}-01-01`, hoje], label: `em ${y}` }
  if (ano) return { r: [`${ano[1]}-01-01`, `${ano[1]}-12-31`], label: `em ${ano[1]}` }
  if (/todo o historico|desde o inicio|desde sempre|tudo que|historico completo|todas as compras/.test(n)) return { r: ['0000-01-01', '9999-12-31'], label: 'em todo o histórico' }
  return null
}

// ---------- Consultas aos dados ----------
const notasEm = (S, r) => S.notes.filter(x => x.date >= r[0] && x.date <= r[1])
const itensDe = ns => ns.flatMap(x => x.items.map(i => ({ ...i, n: x })))
const limites = S => { const d = S.notes.map(x => x.date).sort(); return d.length ? [d[0], d[d.length - 1]] : null }
// Ajusta "todo o histórico" para as datas reais dos registros
const ajustar = (S, p) => { const l = limites(S); return l && p.r[0] === '0000-01-01' ? { ...p, r: l } : p }

// Resposta para período sem compras: diz o que aconteceu e onde há dados, sem inventar.
function semDados(S, p) {
  const l = limites(S)
  if (!l) return 'Ainda não há nenhuma nota fiscal registrada, então não tenho dados para analisar. Cadastre uma nota na aba **Cadastro**.'
  const antes = S.notes.filter(x => x.date < p.r[0]).sort((a, b) => a.date < b.date ? 1 : -1)[0]
  let t = `Não encontrei compras registradas ${p.label} (${faixa(p.r)}).\n`
  t += `- Seus registros vão de ${B(dmy(l[0]))} a ${B(dmy(l[1]))}.\n`
  if (antes) t += `- A compra mais recente antes desse período foi em ${B(dmy(antes.date))} (${estName(antes.est)}).\n`
  return t + '> Não estimo valores para períodos sem notas. Se faltou cadastrar alguma compra, use a aba Cadastro.'
}

// Índice de preço por supermercado no período.
// Para cada produto comprado em 2 ou mais mercados, compara o preço médio pago em cada mercado com a média geral do produto.
// Índice do mercado = média dessas razões (1,00 = na média). Só entram mercados com pelo menos 3 produtos comparáveis.
// Menor índice = mais vantajoso; maior = menos vantajoso.
export function indicePrecos(its, minProdutos = 3) {
  const p = {}
  its.forEach(i => { const k = norm(i.name); ((p[k] = p[k] || {})[i.n.est] = p[k][i.n.est] || []).push(i.unitPrice) })
  const media = a => sum(a) / a.length
  const por = {}
  Object.values(p).forEach(m => {
    const ests = Object.keys(m); if (ests.length < 2) return
    const avg = Object.fromEntries(ests.map(e => [e, media(m[e])])), ref = media(Object.values(avg))
    ests.forEach(e => (por[e] = por[e] || []).push(avg[e] / ref))
  })
  return Object.entries(por).filter(([, v]) => v.length >= minProdutos)
    .map(([est, v]) => ({ est, idx: media(v), produtos: v.length })).sort((a, b) => a.idx - b.idx)
}
const descIdx = x => { const d = Math.round((x.idx - 1) * 1000) / 10; return d === 0 ? 'preços na média' : `preços ${Math.abs(d).toLocaleString('pt-BR')}% ${d < 0 ? 'abaixo' : 'acima'} da média` }

// Produtos e categorias citados na pergunta
const PARADAS = new Set(['com', 'para', 'por', 'que', 'mais', 'menos', 'onde', 'quanto', 'qual', 'quais', 'gastei', 'comprei', 'preco', 'barato', 'caro', 'este', 'esse', 'mes', 'semana', 'dia', 'ano', 'tipo', 'unidade', 'pacote', 'lata', 'garrafa', 'kg'])
function produtoCitado(S, n) {
  const nomes = [...new Set(S.notes.flatMap(x => x.items.map(i => i.name)))]
  const score = x => norm(x).split(/[\s,.-]+/).filter(w => w.length > 2 && !/\d/.test(w) && !PARADAS.has(w) && new RegExp(`\\b${w}`).test(n)).length
  const sc = nomes.map(x => [x, score(x)]).filter(a => a[1] > 0)
  if (!sc.length) return null
  const max = Math.max(...sc.map(a => a[1]))
  return sc.filter(a => a[1] === max).map(a => a[0])
}
function categoriaCitada(S, n) {
  const cats = [...new Set(S.notes.flatMap(x => x.items.map(i => i.cat)))]
  return cats.find(c => { const k = norm(c); return n.includes(k) || n.includes(k.replace(/s$/, '')) || n.includes(k.replace(/(o|a)s$/, '')) }) || null
}

// ---------- Respostas ----------
function total(S, p) {
  const ns = notasEm(S, p.r); if (!ns.length) return semDados(S, p)
  const its = itensDe(ns), tot = sum(its.map(i => i.total)), na = sum(its.filter(i => i.cat === NAO_ALIM).map(i => i.total))
  let t = `### Gasto ${p.label}\n- Período: ${B(faixa(p.r))}\n- Total gasto: ${B(brl(tot))} em ${B(compras(ns.length))}\n- Média por compra: ${brl(tot / ns.length)}\n- Itens comprados: ${its.length}`
  if (na > 0) t += `\n- Desse total, ${brl(na)} foram itens não alimentícios`
  return t
}

function porCategoria(S, p) {
  const ns = notasEm(S, p.r); if (!ns.length) return semDados(S, p)
  const its = itensDe(ns), tot = sum(its.map(i => i.total)), c = {}
  its.forEach(i => { c[i.cat] = (c[i.cat] || 0) + i.total })
  return `### Gasto por categoria ${p.label}\n` + Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v], i) => `${i + 1}. ${k}: ${B(brl(v))} (${pct(v / tot * 100)})`).join('\n') + `\n> Total do período (${faixa(p.r)}): ${brl(tot)}.`
}

function porMercado(S, p) {
  const ns = notasEm(S, p.r); if (!ns.length) return semDados(S, p)
  const e = {}; ns.forEach(x => { (e[x.est] = e[x.est] || { v: 0, n: 0 }); e[x.est].v += x.total; e[x.est].n++ })
  const l = Object.entries(e).sort((a, b) => b[1].v - a[1].v)
  return `### Onde você gastou ${p.label}\n` + l.map(([k, v], i) => `${i + 1}. ${estName(k)}: ${B(brl(v.v))} em ${v.n} ${v.n === 1 ? 'compra' : 'compras'}`).join('\n') +
    `\n> Gastar mais em um mercado não significa que ele é mais caro. Pergunte "qual mercado é mais vantajoso?" para comparar os preços.`
}

function vantagem(S, p) {
  const ns = notasEm(S, p.r); if (!ns.length) return semDados(S, p)
  const ix = indicePrecos(itensDe(ns))
  if (ix.length < 2) return `${p.label[0].toUpperCase() + p.label.slice(1)} (${faixa(p.r)}) não há produtos suficientes comprados em mais de um mercado para comparar preços com segurança (mínimo de 3 produtos em comum por mercado). Tente um período maior, por exemplo "últimos 3 meses".`
  return `### Comparação de preços entre mercados ${p.label}\n` + ix.map((x, i) => `${i + 1}. ${estName(x.est)}: ${descIdx(x)} (${x.produtos} produtos comparados)`).join('\n') +
    `\n- Mais vantajoso: ${B(estName(ix[0].est))}\n- Menos vantajoso: ${B(estName(ix[ix.length - 1].est))}\n> Como comparei: para cada produto comprado em dois ou mais mercados, comparei o preço médio pago em cada um com a média do produto.`
}

function ultima(S) {
  const l = [...S.notes].sort((a, b) => a.date < b.date ? 1 : -1)[0]
  if (!l) return 'Ainda não há notas registradas.'
  return `### Última compra registrada\n- Data: ${B(dmy(l.date))}\n- Mercado: ${B(estName(l.est))}\n- Itens: ${l.items.length}\n- Total: ${B(brl(l.total))}` + (l.pay ? `\n- Pagamento: ${l.pay}` : '') +
    '\n- Itens mais caros: ' + [...l.items].sort((a, b) => b.total - a.total).slice(0, 3).map(i => `${i.name} (${brl(i.total)})`).join(', ')
}

function diaCaro(S, p) {
  const ns = notasEm(S, p.r); if (!ns.length) return semDados(S, p)
  const d = {}; ns.forEach(x => { d[x.date] = (d[x.date] || 0) + x.total })
  const [dia, v] = Object.entries(d).sort((a, b) => b[1] - a[1])[0]
  const doDia = ns.filter(x => x.date === dia)
  return `O dia com maior gasto ${p.label} foi ${B(dmy(dia))}: ${B(brl(v))} em ${doDia.length} ${doDia.length === 1 ? 'compra' : 'compras'} (${[...new Set(doDia.map(x => estName(x.est)))].join(', ')}).`
}

function itemCaro(S, p) {
  const ns = notasEm(S, p.r); if (!ns.length) return semDados(S, p)
  const g = {}; itensDe(ns).forEach(i => { g[i.name] = (g[i.name] || 0) + i.total })
  return `### Produtos com maior gasto ${p.label}\n` + Object.entries(g).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v], i) => `${i + 1}. ${k}: ${B(brl(v))}`).join('\n')
}

function contagem(S, p) {
  const ns = notasEm(S, p.r); if (!ns.length) return semDados(S, p)
  return `${ns.length === 1 ? 'Foi' : 'Foram'} ${B(compras(ns.length))} ${p.label} (${faixa(p.r)}), com ${B(sum(ns.map(x => x.items.length)))} itens.`
}

function comparar(S, p) {
  const n = dias(p.r), ant = [add(p.r[0], -n), add(p.r[0], -1)]
  const a = sum(notasEm(S, p.r).map(x => x.total)), b = sum(notasEm(S, ant).map(x => x.total))
  if (!a && !b) return semDados(S, p)
  let t = `### Comparação ${p.label}\n- ${faixa(p.r)}: ${B(brl(a))}\n- Período anterior, mesmo número de dias (${faixa(ant)}): ${B(brl(b))}`
  if (b > 0) { const d = (a - b) / b * 100; t += `\n- Variação: ${B((d > 0 ? '+' : '') + Math.round(d) + '%')} (${d > 0 ? 'gastou mais' : d < 0 ? 'gastou menos' : 'igual'})` }
  else t += '\n> Não há compras no período anterior, então não dá para calcular a variação.'
  return t
}

// Preço de um produto em cada mercado. Para não comparar preço antigo com preço novo, o ranking usa
// a média paga nos 120 dias anteriores à última compra do produto; mercados sem compra nesse intervalo aparecem à parte.
function preco(S, prods, p) {
  const r = p?.r || ['0000-01-01', '9999-12-31']
  const nome = prods[0]
  const its = itensDe(notasEm(S, r)).filter(i => i.name === nome).sort((a, b) => a.n.date < b.n.date ? -1 : 1)
  if (!its.length) return `Não encontrei compras de ${B(nome)} ${p ? p.label : 'no histórico'}.`
  const ult = its[its.length - 1].n.date, ini = add(ult, -119)
  const m = {}
  its.forEach(i => { const x = (m[i.n.est] = m[i.n.est] || { last: 0, dt: '', rec: [] }); x.last = i.unitPrice; x.dt = i.n.date; if (i.n.date >= ini) x.rec.push(i.unitPrice) })
  const media = a => sum(a) / a.length
  const rec = Object.entries(m).filter(([, v]) => v.rec.length).sort((a, b) => media(a[1].rec) - media(b[1].rec))
  const velhos = Object.entries(m).filter(([, v]) => !v.rec.length)
  let t = `### ${nome}\nPreço médio pago de ${faixa([ini > r[0] ? ini : r[0], ult])}${p ? ' (' + p.label + ')' : ''}:\n` +
    rec.map(([e, v]) => `- ${estName(e)}: ${B(brl(media(v.rec)))} (${v.rec.length}x · último ${brl(v.last)} em ${dmy(v.dt)})`).join('\n')
  if (velhos.length) t += `\n- Sem compra recente: ` + velhos.map(([e, v]) => `${estName(e)} (${brl(v.last)} em ${dmy(v.dt)})`).join(', ')
  t += rec.length > 1 ? `\n- Mais barato: ${B(estName(rec[0][0]))}, ${brl(media(rec[rec.length - 1][1].rec) - media(rec[0][1].rec))} a menos por ${its[0].unit} que o mais caro`
    : `\n> Nesse intervalo você só comprou este produto em um mercado, então não há comparação de preço.`
  if (prods.length > 1) t += `\n> Também encontrei: ${prods.slice(1, 4).join(', ')}. Cite o nome completo para ver outro produto.`
  return t
}

function gastoProduto(S, prods, p) {
  const ns = notasEm(S, p.r); if (!ns.length) return semDados(S, p)
  const its = itensDe(ns).filter(i => prods.includes(i.name))
  if (!its.length) return `Não encontrei compras de ${B(prods[0])} ${p.label} (${faixa(p.r)}).`
  const g = {}; its.forEach(i => { (g[i.name] = g[i.name] || { v: 0, q: 0, u: i.unit, n: 0 }); g[i.name].v += i.total; g[i.name].q += i.qty; g[i.name].n++ })
  return `### Gasto com ${prods.length > 1 ? 'esses produtos' : prods[0]} ${p.label}\n` +
    Object.entries(g).sort((a, b) => b[1].v - a[1].v).map(([k, v]) => `- ${k}: ${B(brl(v.v))} (${r2(v.q).toLocaleString('pt-BR')} ${v.u}, ${v.n}x)`).join('\n') +
    (prods.length > 1 ? `\n- Total: ${B(brl(sum(its.map(i => i.total))))}` : '')
}

function gastoCategoria(S, cat, p) {
  const ns = notasEm(S, p.r); if (!ns.length) return semDados(S, p)
  const its = itensDe(ns).filter(i => i.cat === cat), tot = sum(itensDe(ns).map(i => i.total))
  if (!its.length) return `Não há itens de ${B(cat)} ${p.label} (${faixa(p.r)}).`
  const v = sum(its.map(i => i.total)), g = {}
  its.forEach(i => { g[i.name] = (g[i.name] || 0) + i.total })
  return `### ${cat} ${p.label}\n- Gasto: ${B(brl(v))} (${pct(v / tot * 100)} do total do período)\n- Itens comprados: ${its.length}\n- Mais caros: ` +
    Object.entries(g).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, x]) => `${k} (${brl(x)})`).join(', ')
}

// Relatório estruturado: período, total, top 3 categorias e mercado mais e menos vantajoso
export function relatorio(S, p) {
  const ns = notasEm(S, p.r); if (!ns.length) return semDados(S, p)
  const its = itensDe(ns), tot = sum(its.map(i => i.total))
  const alim = its.filter(i => i.cat !== NAO_ALIM), na = tot - sum(alim.map(i => i.total))
  const c = {}; alim.forEach(i => { c[i.cat] = (c[i.cat] || 0) + i.total })
  const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const n = dias(p.r), ant = [add(p.r[0], -n), add(p.r[0], -1)], vAnt = sum(notasEm(S, ant).map(x => x.total))
  const gasto = {}; ns.forEach(x => { gasto[x.est] = (gasto[x.est] || 0) + x.total })
  const maisGasto = Object.entries(gasto).sort((a, b) => b[1] - a[1])[0]
  const ix = indicePrecos(its)

  let t = `### Relatório de ${faixa(p.r)}\n`
  t += `- Período: ${B(faixa(p.r))} (${n} ${n === 1 ? 'dia' : 'dias'})\n`
  t += `- Total gasto: ${B(brl(tot))} em ${compras(ns.length)} (média ${brl(tot / ns.length)} por compra)\n`
  if (na > 0) t += `- Itens não alimentícios: ${brl(na)} (fora do ranking de categorias)\n`
  if (vAnt > 0) { const d = (tot - vAnt) / vAnt * 100; t += `- Em relação aos ${n} dias anteriores (${brl(vAnt)}): ${(d > 0 ? '+' : '') + Math.round(d)}%\n` }
  t += `### Top 3 categorias mais caras\n` + (top.length ? top.map(([k, v], i) => `${i + 1}. ${k}: ${B(brl(v))} (${pct(v / tot * 100)})`).join('\n') : '- Não há itens alimentares no período.') + '\n'
  t += `### Supermercados\n`
  if (ix.length >= 2) {
    t += `- Mais vantajoso: ${B(estName(ix[0].est))}, ${descIdx(ix[0])} (${ix[0].produtos} produtos comparados)\n`
    t += `- Menos vantajoso: ${B(estName(ix[ix.length - 1].est))}, ${descIdx(ix[ix.length - 1])} (${ix[ix.length - 1].produtos} produtos comparados)\n`
  } else t += '- Não há produtos suficientes comprados em mais de um mercado neste período para dizer qual foi mais ou menos vantajoso (mínimo de 3 produtos em comum).\n'
  t += `- Onde você mais gastou: ${estName(maisGasto[0])} (${brl(maisGasto[1])})\n`
  t += '> Vantagem = preço médio pago em cada mercado comparado com a média do mesmo produto nos outros mercados do período.'
  return t
}

// Plano para economizar: usa os preços que o usuário já pagou (últimos 90 dias com registro).
function plano(S, n) {
  const l = limites(S); if (!l) return semDados(S, { r: [today(), today()], label: 'no histórico' })
  const fim = l[1] < today() ? l[1] : today(), r = [add(fim, -89), fim]
  const ns = notasEm(S, r); if (!ns.length) return semDados(S, { r, label: 'nos últimos 90 dias' })
  const its = itensDe(ns), tot = sum(its.map(i => i.total)), mensal = tot / 3

  // Economia trocando de mercado: diferença entre o preço pago e o menor preço médio do mesmo produto em outro mercado
  const p = {}
  its.forEach(i => { const k = i.name; ((p[k] = p[k] || {})[i.n.est] = p[k][i.n.est] || []).push(i.unitPrice) })
  const eco = {}
  its.forEach(i => {
    const m = p[i.name]; if (Object.keys(m).length < 2) return
    const melhor = Object.entries(m).map(([e, v]) => [e, sum(v) / v.length]).sort((a, b) => a[1] - b[1])[0]
    const ganho = (i.unitPrice - melhor[1]) * i.qty
    if (ganho > 0.005) { (eco[i.name] = eco[i.name] || { v: 0, est: melhor[0], pr: melhor[1] }); eco[i.name].v += ganho }
  })
  const topEco = Object.entries(eco).sort((a, b) => b[1].v - a[1].v).slice(0, 5)
  const ecoMensal = sum(Object.values(eco).map(x => x.v)) / 3
  const c = {}; its.filter(i => i.cat !== NAO_ALIM).forEach(i => { c[i.cat] = (c[i.cat] || 0) + i.total })
  const [catTop, catV] = Object.entries(c).sort((a, b) => b[1] - a[1])[0] || []

  const metaTxt = n.match(/(?:r\$\s*)?(\d{2,6}(?:[.,]\d{1,2})?)\s*(?:reais|r\$)?/)
  const meta = /meta|gastar|orcamento|limite/.test(n) && metaTxt ? +metaTxt[1].replace(',', '.') : null

  let t = `### Plano para economizar\nBase: suas compras de ${B(faixa(r))} (últimos 90 dias com registro).\n`
  t += `- Gasto médio mensal: ${B(brl(mensal))}\n`
  if (catTop) t += `- Categoria que mais pesa: ${B(catTop)}, ${brl(catV / 3)} por mês (${pct(catV / tot * 100)})\n`
  t += `- Economia possível só comprando cada produto no mercado onde ele saiu mais barato: cerca de ${B(brl(ecoMensal))} por mês\n`
  if (topEco.length) t += `### Onde dá para economizar mais\n` + topEco.map(([k, v], i) => `${i + 1}. ${k}: compre no ${B(estName(v.est))} (média ${brl(v.pr)}). Economia no período: ${brl(v.v)}`).join('\n') + '\n'
  t += `### Meta sugerida\n`
  if (meta) {
    const dif = mensal - meta
    t += dif > 0 ? `- Sua meta: ${B(brl(meta))} por mês, ${brl(dif)} (${pct(dif / mensal * 100)}) abaixo da sua média.\n` + (ecoMensal >= dif ? '- Só trocando de mercado nos produtos acima você já alcança essa meta.\n' : `- Trocar de mercado cobre ${brl(ecoMensal)}; o restante (${brl(dif - ecoMensal)}) precisa vir de reduzir quantidades, principalmente em ${catTop}.\n`)
      : `- Sua meta de ${B(brl(meta))} por mês já está acima da sua média (${brl(mensal)}). Você está dentro dela.\n`
  } else t += `- ${B(brl(Math.max(0, Math.floor((mensal - ecoMensal) / 10) * 10)))} por mês: a sua média menos a economia possível com a troca de mercado. Para outra meta, escreva por exemplo "minha meta é gastar 800 por mês".\n`
  const [ms, me] = mesRange(+today().slice(0, 4), +today().slice(5, 7) - 1), atual = sum(notasEm(S, [ms, today()]).map(x => x.total))
  if (atual > 0) {
    const dd = dias([ms, today()]), dm = dias([ms, me])
    t += dd >= dm ? `- Neste mês você gastou ${brl(atual)}.\n` : `- Neste mês você já gastou ${brl(atual)}; nesse ritmo, fecha em cerca de ${brl(atual / dd * dm)}.\n`
  }
  return t + '> Estimativas feitas com os preços registrados nas suas notas. Preços futuros podem mudar.'
}

const AJUDA = 'Posso responder sobre:\n- gasto total em um período ("quanto gastei em agosto?");\n- gasto por categoria ou por produto ("quanto gastei com carnes?");\n- onde você gastou mais e qual mercado é mais vantajoso;\n- última compra, dia e produtos mais caros;\n- preço de um produto em cada mercado ("onde comprar arroz mais barato?");\n- relatório de um intervalo ("relatório de 01/08/2026 a 31/08/2026");\n- plano para economizar ("como posso economizar?").'
const FORA = 'Desculpe, não posso ajudar com isso. Eu sou o GestorIA e atendo **apenas** a análise financeira do seu consumo de alimentos: gastos, relatórios, comparação de mercados e planejamento para economizar.\n' + AJUDA

const DOMINIO = /gast|compr|mercad|supermerc|nota|preco|custo|custa|barat|caro|paguei|valor|categor|aliment|produt|item|itens|econom|relatorio|resumo|total|dinheiro|reais|orcamento|despesa|consumo|poupar|meta/
const FORA_RE = /piada|futebol|politic|eleic|receita de|como (fazer|preparar|cozinhar)|programa(r|cao)|codigo|clima|previsao do tempo|filme|serie|musica|cancao|poema|poesia|redacao|traduz|horoscopo|namor|jogo|noticia|capital d|quem (ganhou|descobriu|inventou)/

// Responde a uma pergunta. ctx é a memória da conversa (último período, assunto e produto).
// Devolve { t: texto, title: título sugerido para o chat, ctx: nova memória }.
export function responder(q, S, ctx = {}) {
  const n = norm(q).replace(/\s+/g, ' ').trim()
  const per = lerPeriodo(n)
  const p = ajustar(S, per || ctx.p || { r: mesRange(+today().slice(0, 4), +today().slice(5, 7) - 1), label: 'este mês' })
  const out = (t, intent, title, extra = {}) => ({ t, title, ctx: { ...ctx, p, intent, ...extra } })
  const rot = nomeFaixa(p.r)

  if (!n) return { t: AJUDA, ctx }
  if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai|opa|hey|hello)\b/.test(n) && n.split(' ').length <= 4) return { t: WELCOME, ctx }
  if (/quem (e|eh) voce|o que voce (faz|sabe)|como (voce )?funciona|^ajuda|o que (posso|consigo) (perguntar|fazer)/.test(n)) return { t: WELCOME + '\n' + AJUDA, ctx }
  if (/obrigad|valeu|agradec/.test(n)) return { t: 'Por nada! Se quiser, posso gerar um relatório ou montar um plano para economizar.', ctx }
  if (FORA_RE.test(n) && !/relatorio|gast|econom/.test(n)) return { t: FORA, ctx }

  if (/relatorio|resumo|balanco/.test(n)) return out(relatorio(S, p), 'relatorio', 'Relatório · ' + faixa(p.r))
  if (/econom|poupar|planej|meta|reduzir|gastar menos|orcamento|dica/.test(n)) return out(plano(S, n), 'plano', 'Plano para economizar')

  const prods = produtoCitado(S, n), cat = categoriaCitada(S, n)
  if (prods && /barat|preco|custa|caro|onde compr|valor|vale/.test(n) && !/mercado mais|supermercado mais/.test(n))
    return out(preco(S, prods, per && ajustar(S, per)), 'preco', 'Preço · ' + prods[0], { prods })
  if (/vantaj|mercado mais barato|supermercado mais barato|melhor mercado|melhor supermercado|mercado mais caro/.test(n)) return out(vantagem(S, p), 'vantagem', 'Mercados mais vantajosos · ' + rot)
  if (cat && cat !== NAO_ALIM && /gast|compr|quant/.test(n)) return out(gastoCategoria(S, cat, p), 'categoria1', cat + ' · ' + rot, { cat })
  if (prods && /gast|compr|quant/.test(n) && !/categoria/.test(n)) return out(gastoProduto(S, prods, p), 'produto', 'Gasto com ' + prods[0], { prods })
  if (/categoria|tipo de (produto|alimento)/.test(n)) return out(porCategoria(S, p), 'categoria', 'Gasto por categoria · ' + rot)
  if (/ultim(a|o) (compra|nota)|compra mais recente/.test(n)) return out(ultima(S), 'ultima', 'Última compra')
  if (/dia mais caro|dia (em )?que (mais )?gastei/.test(n)) return out(diaCaro(S, p), 'dia', 'Dia mais caro · ' + rot)
  if (/(item|produto)s? mais car|o que (mais )?pesou/.test(n)) return out(itemCaro(S, p), 'itens', 'Produtos mais caros · ' + rot)
  if (/onde|mercado|supermercado|estabelec|loja/.test(n)) return out(porMercado(S, p), 'mercado', 'Gasto por mercado · ' + rot)
  if (/compar|diferenca|em relacao|variacao/.test(n)) return out(comparar(S, p), 'comparar', 'Comparação · ' + rot)
  if (/quant(a|o)s/.test(n) && /nota|compra/.test(n)) return out(contagem(S, p), 'contagem', 'Quantidade de compras · ' + rot)
  if (/gast|total|paguei|custou|despesa/.test(n)) return out(total(S, p), 'total', 'Gasto · ' + rot)

  // Memória: "e em agosto?" repete o último assunto com o novo período
  if (per && ctx.intent) {
    const repete = { relatorio: () => relatorio(S, p), total: () => total(S, p), categoria: () => porCategoria(S, p), mercado: () => porMercado(S, p), vantagem: () => vantagem(S, p),
      dia: () => diaCaro(S, p), itens: () => itemCaro(S, p), comparar: () => comparar(S, p), contagem: () => contagem(S, p),
      produto: () => gastoProduto(S, ctx.prods, p), preco: () => preco(S, ctx.prods, p), categoria1: () => gastoCategoria(S, ctx.cat, p) }[ctx.intent]
    if (repete) return out(repete(), ctx.intent, null)
  }
  if (per) return out(total(S, p), 'total', 'Gasto · ' + rot)
  if (prods) return out(preco(S, prods, null), 'preco', 'Preço · ' + prods[0], { prods })
  if (DOMINIO.test(n)) return { t: 'Não entendi bem a pergunta. ' + AJUDA, ctx }
  return { t: FORA, ctx }
}

// Datas do intervalo padrão para o seletor de relatório (mês anterior ao de hoje)
export const relatorioPadrao = () => { const t = today(); return mesRange(+t.slice(0, 4), +t.slice(5, 7) - 2) }

// ---------- Ferramentas da LLM ----------
// Fora do escopo evidente: responde sem consultar a LLM (mesma regra do modo local).
export const foraDoEscopo = q => { const n = norm(q); return FORA_RE.test(n) && !DOMINIO.test(n) }
export const RESPOSTA_FORA = FORA

const dataOk = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(dt(s))
const periodoDe = (S, a = {}) => {
  if (!dataOk(a.inicio) || !dataOk(a.fim)) return null
  const r = [a.inicio, a.fim].sort()
  return ajustar(S, { r, label: r[0] === r[1] ? 'em ' + dmy(r[0]) : 'de ' + faixa(r) })
}
const ERRO_DATA = 'Erro: informe inicio e fim no formato AAAA-MM-DD.'

function listaCompras(S, p) {
  const ns = notasEm(S, p.r).sort((a, b) => a.date < b.date ? -1 : 1)
  if (!ns.length) return semDados(S, p)
  const lim = 60
  return `### Compras ${p.label}\n` + ns.slice(0, lim).map(x => `- ${dmy(x.date)} · ${estName(x.est)} · ${x.items.length} itens · ${brl(x.total)}` + (x.pay ? ` · ${x.pay}` : '')).join('\n') +
    (ns.length > lim ? `\n> Mostrando ${lim} de ${ns.length} compras. Total do período: ${brl(sum(ns.map(x => x.total)))}.` : `\n> Total do período: ${brl(sum(ns.map(x => x.total)))}.`)
}

// Executa uma ferramenta pedida pela LLM e devolve o resultado em texto (com os números calculados das notas).
export function executarFerramenta(nome, a, S) {
  a = a || {}
  if (nome === 'consultar_periodo') {
    const p = periodoDe(S, a); if (!p) return ERRO_DATA
    const f = { total, categorias: porCategoria, mercados: porMercado, vantagem, relatorio, dia_mais_caro: diaCaro, produtos_mais_caros: itemCaro, contagem, comparar, compras: listaCompras }[a.tipo]
    return f ? f(S, p) : 'Erro: tipo de consulta desconhecido.'
  }
  if (nome === 'consultar_produto') {
    const prods = produtoCitado(S, norm(String(a.termo || '')))
    if (!prods) return `Nenhum produto com o nome "${a.termo}" foi encontrado nas notas registradas.`
    const p = a.inicio || a.fim ? periodoDe(S, a) : null
    if ((a.inicio || a.fim) && !p) return ERRO_DATA
    if (a.tipo === 'gasto') return gastoProduto(S, prods, p || ajustar(S, { r: ['0000-01-01', '9999-12-31'], label: 'em todo o histórico' }))
    return preco(S, prods, p)
  }
  if (nome === 'consultar_categoria') {
    const p = periodoDe(S, a); if (!p) return ERRO_DATA
    const cat = categoriaCitada(S, norm(String(a.categoria || '')))
    return cat ? gastoCategoria(S, cat, p) : `A categoria "${a.categoria}" não existe nas notas. Categorias registradas: ${[...new Set(S.notes.flatMap(x => x.items.map(i => i.cat)))].join(', ')}.`
  }
  if (nome === 'ultima_compra') return ultima(S)
  if (nome === 'plano_economia') return plano(S, a.meta_mensal > 0 ? `minha meta e gastar ${a.meta_mensal} reais` : '')
  return 'Erro: ferramenta desconhecida.'
}

// Contexto enviado com cada pergunta: data de hoje e o que existe nos registros (sem os dados das notas).
export function contextoLLM(S) {
  const l = limites(S)
  return {
    hoje: today(), registros: l, nNotas: S.notes.length,
    mercados: [...new Set(S.notes.map(x => x.est))].map(estName),
    categorias: [...new Set(S.notes.flatMap(x => x.items.map(i => i.cat)))],
    usuario: S.user?.name?.split(' ')[0],
  }
}
