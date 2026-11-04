// Converte uma pasta de XMLs de NFC-e fictícias em src/data/notas.json (formato descrito em README.md, seção 8).
// Uso: npm run dados -- <pasta-com-xmls> [saida.json]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { XMLParser } from 'fast-xml-parser'

const [, , pasta, saida = 'src/data/notas.json'] = process.argv
if (!pasta) { console.error('Informe a pasta com os XMLs. Ex.: npm run dados -- ./xml'); process.exit(1) }

// O XML só informa se o item é alimentício. As categorias abaixo são definidas pelo nome do produto.
const NAO_ALIM = 'Não alimentício'
const REGRAS = [
  ['Hortifruti', /^(abacate|alface|banana|batata|cebola|cenoura|cheiro-verde|laranja|mamão|maçã|tomate)/i],
  ['Carnes', /^(carne moída|filezinho|patinho|peito de frango|hambúrguer|linguiça)/i],
  ['Congelados', /^(pizza congelada|sorvete|polpa de fruta)/i],
  ['Laticínios', /^(creme de leite|iogurte|leite condensado|leite integral|manteiga|queijo|ovos)/i],
  ['Padaria', /^(pão|biscoito)/i],
  ['Bebidas', /^(refrigerante|suco|água mineral)/i],
]
const categoria = (nome, alimenticio) => alimenticio === false ? NAO_ALIM : (REGRAS.find(([, re]) => re.test(nome))?.[0] || 'Mercearia')

const parser = new XMLParser({ parseTagValue: false, isArray: n => n === 'item' })
const num = v => Math.round(parseFloat(v) * 100) / 100
const emitentes = new Map() // cnpj -> { id, nome, cnpj }
const notas = []

for (const arq of readdirSync(pasta).filter(f => f.endsWith('.xml')).sort()) {
  const x = parser.parse(readFileSync(join(pasta, arq), 'utf8')).nfce
  const { cnpj, nome } = x.emitente
  if (!emitentes.has(cnpj)) emitentes.set(cnpj, { id: 's' + (emitentes.size + 1), nome, cnpj })
  const itens = x.itens.item.map(i => ({
    nome: i.nome,
    categoria: categoria(i.nome, i.alimenticio ? i.alimenticio === 'sim' : i.categoria === 'alimentício'),
    quantidade: num(i.quantidade), unidade: i.unidade.toLowerCase(), valorUnitario: num(i.valorUnitario), valorTotal: num(i.valorTotal),
  }))
  notas.push({
    id: 'nfce-' + x.identificacao.numero, numero: x.identificacao.numero, codigo: x.identificacao.codigoNota,
    chave: x.identificacao.chaveAcessoFicticia, emitente: emitentes.get(cnpj).id, data: x.identificacao.data,
    pagamento: x.formaPagamento, total: num(x.totalCompra), itens,
  })
}
writeFileSync(saida, JSON.stringify({ emitentes: [...emitentes.values()], notas }))
console.log(`${notas.length} notas, ${notas.reduce((s, n) => s + n.itens.length, 0)} itens, ${emitentes.size} emitentes -> ${saida}`)
