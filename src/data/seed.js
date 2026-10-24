// Base de dados do app: notas fiscais fictícias (NFC-e) em src/data/notas.json.
// Para trocar a base, substitua o notas.json (formato no README.md, seção 8) e rode: npm run validar
import base from './notas.json'

export const NAO_ALIM = 'Não alimentício'

// Estabelecimentos (emitentes) vêm do próprio JSON.
export const EST = base.emitentes.map(e => ({ id: e.id, name: e.nome, cnpj: e.cnpj }))

// Cores fixas por categoria. As demais recebem cores da PALETTE automaticamente.
export const CATS = { Hortifruti: '#2E4429', Mercearia: '#C0402A', Laticínios: '#E3A53A', Carnes: '#8C5A3C', Bebidas: '#3B6E8F', Padaria: '#D9822B', Congelados: '#5B8E7D', [NAO_ALIM]: '#9A9A8A', Outros: '#9A9A8A' }

// Local de armazenamento sugerido por categoria (o item pode trazer "armazenamento" no JSON)
const STORAGE = { Laticínios: 'geladeira', Hortifruti: 'geladeira', Carnes: 'freezer', Congelados: 'freezer' }

export const BASE_NOTES = base.notas.map(n => ({
  id: n.id, nf: n.numero, codigo: n.codigo, chave: n.chave, est: n.emitente, date: n.data, pay: n.pagamento, total: n.total,
  items: n.itens.map(i => ({ name: i.nome, cat: i.categoria, qty: i.quantidade, unit: i.unidade, unitPrice: i.valorUnitario, total: i.valorTotal, storage: i.armazenamento || STORAGE[i.categoria] || 'despensa' })),
}))

// Data tratada como "hoje": o último dia da base (troque por new Date().toISOString().slice(0, 10) para usar a data real).
export const APP_TODAY = BASE_NOTES.reduce((m, n) => n.date > m ? n.date : m, '0000-00-00')

// Estabelecimento pelo CNPJ. Se o CNPJ não existir na base (nota cadastrada de um mercado novo), é incluído na lista.
export function ensureEst(nome, cnpj) {
  const so = c => c.replace(/\D/g, '')
  const achado = EST.find(e => so(e.cnpj) === so(cnpj))
  if (achado) return achado.id
  const novo = { id: 'u' + so(cnpj), name: nome, cnpj }
  EST.push(novo)
  return novo.id
}

// Paleta de reserva: cores atribuídas automaticamente a categorias novas (as 5 primeiras de CATS têm cor fixa).
export const PALETTE=['#D9822B','#A23B72','#3B6E8F','#6C4F9A','#2F8F83','#C9A227','#8F2D56','#5B8E7D','#D1495B','#EDAE49','#00798C','#30638E','#7A9E3B','#B5651D','#6D597A','#B56576','#E56B6F','#355070','#99B898','#E8A87C','#C38D9E','#41B3A3','#85A389','#9C6644','#588157','#BC6C25','#7B2CBF','#E76F51','#2A9D8F','#264653'];
// Cor de uma categoria: fixa se conhecida; senão, a próxima cor livre da paleta (ordem alfabética das categorias novas).
export const colorOf=(c,all)=>CATS[c]||PALETTE[all.filter(x=>!CATS[x]).sort().indexOf(c)%PALETTE.length]||CATS.Outros;
