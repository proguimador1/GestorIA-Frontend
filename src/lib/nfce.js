// Nota fiscal "crua" do Cadastro: leitura do XML, números digitados, totais, validação e conversão para o formato do app.
import { NAO_ALIM } from '../data/seed.js'

export const UNIDADES = ['UN', 'KG', 'G', 'L', 'ML', 'DZ']

// Números como o usuário digita (vírgula decimal). "1.235" e "1,235" valem 1.235; "1.234,56" vale 1234.56.
export const toNum = s => {
  if (typeof s === 'number') return s
  const t = String(s ?? '').trim().replace(/\s/g, '')
  if (!t) return NaN
  return Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t)
}
// Valores em reais (2 casas) sempre com duas casas: 4,50. Quantidades e preços unitários (3 casas) sem zeros à direita: 1,235.
export const fmtNum = (v, casas = 2) => !Number.isFinite(v) ? '' : casas === 2 ? v.toFixed(2).replace('.', ',') : String(Math.round(v * 10 ** casas) / 10 ** casas).replace('.', ',')
// Preço unitário: pelo menos 2 casas e até 3 (49,90 · 9,988)
export const fmtPreco = v => !Number.isFinite(v) ? '' : v.toFixed(3).replace(/0$/, '').replace('.', ',')
const r2 = v => Math.round(v * 100) / 100

// Lê o XML da NFC-e fictícia e devolve a nota no formato da tela de confirmação (números como texto editável).
export function parseNfceXml(texto) {
  const doc = new DOMParser().parseFromString(texto, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('XML da nota inválido.')
  const v = (sel, el = doc) => el.querySelector(sel)?.textContent.trim() ?? ''
  return {
    emitente: { razaoSocial: v('emitente > razaoSocial'), cnpj: v('emitente > cnpj'), endereco: v('emitente > endereco') },
    itens: [...doc.querySelectorAll('itens > item')].map((it, k) => ({
      key: 'x' + k,
      codigo: v('codigo', it), descricao: v('descricao', it),
      quantidade: fmtNum(toNum(v('quantidade', it)), 3), unidade: v('unidade', it).toUpperCase(),
      valorUnitario: fmtPreco(toNum(v('valorUnitario', it))), valorTotal: fmtNum(toNum(v('valorTotal', it))),
      alimenticio: v('alimenticio', it) !== 'nao',
    })),
    descontos: fmtNum(toNum(v('totais > descontos'))),
    pagamento: { forma: v('pagamento > formaPagamento'), valorPago: fmtNum(toNum(v('pagamento > valorPago'))) },
    tributos: fmtNum(toNum(v('tributosTotaisIncidentes'))),
    info: {
      tipoEmissao: v('tipoEmissao'), numero: v('informacoesGerais > numero'), serie: v('serie'),
      dataEmissao: v('dataEmissao'), horaEmissao: v('horaEmissao'), via: v('via'),
      protocolo: v('protocoloAutorizacao'), dataAutorizacao: v('dataAutorizacao'), horaAutorizacao: v('horaAutorizacao'),
      ambiente: v('ambiente'), versaoXml: v('versaoXml'),
    },
    chave: v('chaveAcesso > chave'), urlConsulta: v('urlConsulta'),
    consumidor: { cpf: v('consumidor > cpf'), nome: v('consumidor > nome') },
    infoContribuinte: v('informacoesContribuinte'),
  }
}

// Totais sempre calculados a partir dos itens (não são digitados, para os números baterem).
export function totais(nota) {
  const valorTotal = r2(nota.itens.reduce((s, i) => s + (toNum(i.valorTotal) || 0), 0))
  const descontos = toNum(nota.descontos) || 0
  const valorAPagar = r2(valorTotal - descontos)
  const valorPago = toNum(nota.pagamento.valorPago) || 0
  return { qtdItens: nota.itens.length, valorTotal, descontos, valorAPagar, valorPago, troco: r2(Math.max(0, valorPago - valorAPagar)) }
}

// Ao editar um item: quantidade ou valor unitário recalculam o total; o total recalcula o valor unitário.
export function editarItem(item, campo, valor) {
  const novo = { ...item, [campo]: valor }
  const q = toNum(novo.quantidade), u = toNum(novo.valorUnitario), t = toNum(novo.valorTotal)
  if ((campo === 'quantidade' || campo === 'valorUnitario') && q > 0 && u > 0) novo.valorTotal = fmtNum(q * u)
  if (campo === 'valorTotal' && q > 0 && t > 0) novo.valorUnitario = fmtPreco(t / q)
  return novo
}

// Problemas de um item (nome, unidade, quantidade e valor unitário são obrigatórios).
export function errosItem(i) {
  const e = []
  if (!i.descricao.trim()) e.push('nome')
  if (!UNIDADES.includes(i.unidade)) e.push('unidade')
  if (!(toNum(i.quantidade) > 0)) e.push('quantidade')
  if (!(toNum(i.valorUnitario) > 0)) e.push('valor unitário')
  if (!(toNum(i.valorTotal) > 0)) e.push('valor total')
  return e
}

// Validação dos campos exibidos no pop-up de confirmação (estabelecimento, dados da nota e itens) antes da classificação.
// Pagamento, descontos e demais dados vêm do XML e não são editados no pop-up.
export function validarNota(nota) {
  const e = []
  if (!nota.emitente.razaoSocial.trim()) e.push('Informe a razão social do estabelecimento.')
  if (nota.emitente.cnpj.replace(/\D/g, '').length !== 14) e.push('O CNPJ precisa ter 14 dígitos.')
  if (!nota.info.numero.trim()) e.push('Informe o número da nota.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nota.info.dataEmissao)) e.push('Informe a data de emissão.')
  if (nota.chave.replace(/\D/g, '').length !== 44) e.push('A chave de acesso precisa ter 44 dígitos.')
  if (!nota.itens.length) e.push('A nota precisa ter pelo menos um item.')
  nota.itens.forEach((i, k) => { const x = errosItem(i); if (x.length) e.push(`Item ${k + 1}: verifique ${x.join(', ')}.`) })
  return e
}

// Categorização dos itens alimentares. Este é o ponto onde entra a LLM de categorização;
// até lá, regras locais por palavra-chave (as mesmas categorias da base). Aceita descrições abreviadas do caixa.
const REGRAS = [
  ['Hortifruti', /\b(abacate|alface|banana|batata|cebola|cenoura|cheiro|laranja|mamao|maca|tomate|limao|fruta|verdura|legume)/],
  ['Carnes', /\b(carne|patinho|alcatra|frango|file|sassami|hamb|linguica|bovin|suin|peixe|camarao)/],
  ['Congelados', /\b(pizza|sorvete|polpa|congelad)/],
  ['Laticinios', /\b(leite|iogurte|creme de leite|manteiga|queijo|qjo|requeij|ovo)/],
  ['Padaria', /\b(pao|biscoito|bolo|brioche)/],
  ['Bebidas', /\b(refri|refrigerante|suco|agua|cerveja)/],
]
const sem = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
export const categorizar = nome => (REGRAS.find(([, re]) => re.test(sem(nome)))?.[0] || 'Mercearia').replace('Laticinios', 'Laticínios')

// Converte a nota confirmada para o formato usado em Finanças, Notas fiscais e Chatbot.
export function paraNotaDoApp(nota, est) {
  const t = totais(nota)
  return {
    id: 'n' + Date.now(), nf: nota.info.numero, codigo: 'NFCE-' + nota.info.numero, chave: nota.chave.replace(/\D/g, ''),
    est, date: nota.info.dataEmissao, pay: nota.pagamento.forma, total: t.valorTotal, desconto: t.descontos, valorAPagar: t.valorAPagar,
    items: nota.itens.map(i => {
      const qty = toNum(i.quantidade), unitPrice = toNum(i.valorUnitario)
      return { name: i.descricao.trim(), cat: i.alimenticio ? categorizar(i.descricao) : NAO_ALIM, qty, unit: i.unidade.toLowerCase(), unitPrice, total: toNum(i.valorTotal) }
    }),
  }
}
