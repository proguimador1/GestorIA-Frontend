// Valida um arquivo notas.json antes de usá-lo no app.
// Uso: npm run validar            (valida src/data/notas.json)
//      npm run validar -- outro.json
import { readFileSync } from 'node:fs'

const arq = process.argv[2] || 'src/data/notas.json'
const erros = []
const erro = m => { if (erros.length < 25) erros.push(m) }
let d
try { d = JSON.parse(readFileSync(arq, 'utf8')) } catch (e) { console.error('JSON inválido:', e.message); process.exit(1) }

const UNIDADES = ['un', 'kg', 'g', 'l', 'ml', 'dz']
const dataOk = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z'))
if (!Array.isArray(d.emitentes) || !d.emitentes.length) erro('"emitentes" deve ser uma lista não vazia')
if (!Array.isArray(d.notas) || !d.notas.length) erro('"notas" deve ser uma lista não vazia')

const ids = new Set((d.emitentes || []).map(e => e.id))
;(d.emitentes || []).forEach((e, k) => { if (!e.id || !e.nome || !e.cnpj) erro(`emitentes[${k}] precisa de id, nome e cnpj`) })
const vistos = new Set(), nums = new Set(), cats = {}, datas = []
let itens = 0
for (const n of d.notas || []) {
  const r = `nota ${n.id}`
  if (!n.id || vistos.has(n.id)) erro(`${r}: id ausente ou repetido`); vistos.add(n.id)
  if (!n.numero || nums.has(n.numero)) erro(`${r}: numero ausente ou repetido`); nums.add(n.numero)
  if (!ids.has(n.emitente)) erro(`${r}: emitente "${n.emitente}" não existe em "emitentes"`)
  if (!dataOk(n.data)) erro(`${r}: data inválida "${n.data}" (use AAAA-MM-DD)`); else datas.push(n.data)
  if (!n.pagamento) erro(`${r}: falta pagamento`)
  if (!Array.isArray(n.itens) || !n.itens.length) { erro(`${r}: sem itens`); continue }
  let soma = 0
  for (const i of n.itens) {
    itens++
    if (!i.nome || !i.categoria) erro(`${r}: item sem nome ou categoria`)
    if (!UNIDADES.includes(i.unidade)) erro(`${r}: unidade "${i.unidade}" inválida (use ${UNIDADES.join(', ')})`)
    if (!(i.quantidade > 0) || !(i.valorUnitario > 0) || !(i.valorTotal > 0)) erro(`${r}: valores devem ser maiores que zero em "${i.nome}"`)
    if (Math.abs(i.quantidade * i.valorUnitario - i.valorTotal) > 0.011) erro(`${r}: valorTotal de "${i.nome}" não é quantidade x valorUnitario`)
    soma += i.valorTotal; cats[i.categoria] = (cats[i.categoria] || 0) + 1
  }
  if (Math.abs(soma - n.total) > 0.011) erro(`${r}: total ${n.total} difere da soma dos itens ${soma.toFixed(2)}`)
}
if (erros.length) { console.error('PROBLEMAS ENCONTRADOS:\n- ' + erros.join('\n- ')); process.exit(1) }
datas.sort()
console.log(`OK: ${d.notas.length} notas, ${itens} itens, ${d.emitentes.length} emitentes, de ${datas[0]} a ${datas.at(-1)}`)
console.log('Categorias:', cats)
