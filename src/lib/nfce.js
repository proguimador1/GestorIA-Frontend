// Nota fiscal do Cadastro: números digitados, totais, validação (as mesmas regras do backend)
// e montagem do que é enviado para /api/produtos/extrair/, /api/produtos/classificar/ e /api/notas/confirmar/.

// Números como o usuário digita (vírgula decimal). "1.235" e "1,235" valem 1.235; "1.234,56" vale 1234.56.
export const toNum = s => {
  if (typeof s === 'number') return s
  const t = String(s ?? '').trim().replace(/\s/g, '')
  if (!t) return NaN
  return Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t)
}
// Valores em reais (2 casas) sempre com duas casas: 4,50. Quantidades (3 casas) sem zeros à direita: 1,235.
export const fmtNum = (v, casas = 2) => !Number.isFinite(v) ? '' : casas === 2 ? v.toFixed(2).replace('.', ',') : String(Math.round(v * 10 ** casas) / 10 ** casas).replace('.', ',')
const r2 = v => Math.round(v * 100) / 100
const soDigitos = s => String(s ?? '').replace(/\D/g, '')
// true se o número tem mais casas decimais do que o permitido
const passaDe = (v, casas) => Math.abs(v * 10 ** casas - Math.round(v * 10 ** casas)) > 1e-6

export const fmtCnpj = c => {
  const d = soDigitos(c)
  return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : d
}

// Mesma tolerância do backend (serializers.TOLERANCIA): arredondamento de centavos.
export const TOLERANCIA = 0.01
export const LIMITES = { estabelecimento: 60, pagamento: 20, chave: 44, descricao: 255, nome: 100, marca: 50 }

// Total da nota: sempre a soma dos itens (o backend exige que os dois batam).
export function totais(nota) {
  return { qtdItens: nota.itens.length, valorTotal: r2(nota.itens.reduce((s, i) => s + (toNum(i.valorTotal) || 0), 0)) }
}

// Ao editar um item: quantidade ou valor unitário recalculam o total; o total recalcula o valor unitário (2 casas).
export function editarItem(item, campo, valor) {
  const novo = { ...item, [campo]: valor }
  const q = toNum(novo.quantidade), u = toNum(novo.valorUnitario), t = toNum(novo.valorTotal)
  if ((campo === 'quantidade' || campo === 'valorUnitario') && q > 0 && u >= 0) novo.valorTotal = fmtNum(q * u)
  if (campo === 'valorTotal' && q > 0 && t >= 0) novo.valorUnitario = fmtNum(t / q)
  return novo
}

// Problemas de um item, com as regras do ItemNotaSerializer.
export function errosItem(i) {
  const e = []
  const desc = i.descricao.trim()
  if (!desc) e.push('descrição')
  else if (desc.length > LIMITES.descricao) e.push(`descrição (até ${LIMITES.descricao} caracteres)`)
  const q = toNum(i.quantidade), u = toNum(i.valorUnitario), t = toNum(i.valorTotal)
  if (!(q > 0)) e.push('quantidade')
  else if (passaDe(q, 3)) e.push('quantidade (até 3 casas decimais)')
  if (!(u >= 0)) e.push('valor unitário')
  else if (passaDe(u, 2)) e.push('valor unitário (até 2 casas decimais)')
  if (!(t >= 0)) e.push('valor total')
  else if (passaDe(t, 2)) e.push('valor total (até 2 casas decimais)')
  if (q > 0 && u >= 0 && t >= 0 && Math.abs(q * u - t) > TOLERANCIA + 1e-9) e.push(`valor total (quantidade × valor unitário = ${fmtNum(q * u)})`)
  return e
}

// Validação do pop-up de confirmação da nota, antes de enviar para a LLM de extração.
export function validarNota(nota) {
  const e = []
  const nome = nota.estabelecimento.trim()
  if (!nome) e.push('Informe o nome do estabelecimento.')
  else if (nome.length > LIMITES.estabelecimento) e.push(`O nome do estabelecimento pode ter até ${LIMITES.estabelecimento} caracteres.`)
  const cnpj = soDigitos(nota.cnpj)
  if (cnpj && cnpj.length !== 14) e.push('O CNPJ precisa ter 14 dígitos (ou ficar em branco).')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nota.dataCompra)) e.push('Informe a data da compra.')
  if (nota.pagamento.trim().length > LIMITES.pagamento) e.push(`A forma de pagamento pode ter até ${LIMITES.pagamento} caracteres.`)
  const chave = soDigitos(nota.chave)
  if (!chave) e.push('Informe a chave de acesso.')
  else if (chave.length > LIMITES.chave) e.push(`A chave de acesso tem no máximo ${LIMITES.chave} dígitos.`)
  if (!nota.itens.length) e.push('A nota precisa ter pelo menos um item.')
  nota.itens.forEach((i, k) => { const x = errosItem(i); if (x.length) e.push(`Item ${k + 1}: verifique ${x.join(', ')}.`) })
  return e
}

// Datas no formato da API (AAAA-MM-DD). Aceita também DD/MM/AAAA e data com hora.
function dataIso(v) {
  const t = String(v ?? '').trim()
  const br = t.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  return br ? `${br[3]}-${br[2]}-${br[1]}` : t.slice(0, 10)
}

// Resposta da API ({ nfce: {...} }) -> nota do pop-up (números como texto editável).
// "itens" pode chegar como lista, como { item: [...] } ou como um item só (conversão do XML pelo xmltodict).
export function nfceParaNota(n) {
  if (!n || typeof n !== 'object') return null
  const bruto = n.itens?.item ?? n.itens
  const itens = Array.isArray(bruto) ? bruto : bruto && typeof bruto === 'object' ? [bruto] : []
  if (!itens.length) return null
  const txt = v => String(v ?? '').trim()
  return {
    estabelecimento: txt(n.nome_estabelecimento),
    cnpj: fmtCnpj(n.cnpj),
    dataCompra: dataIso(n.data_compra),
    pagamento: txt(n.metodo_pag),
    chave: txt(n.chave_acesso),
    itens: itens.map((i, k) => ({
      key: 'x' + k,
      descricao: txt(i.descricao),
      quantidade: fmtNum(toNum(i.un), 3),
      valorUnitario: fmtNum(toNum(i.valor_unitario)),
      valorTotal: fmtNum(toNum(i.valor_total)),
    })),
  }
}

// Dados da nota no formato do NotaSerializer (POST /api/produtos/extrair/).
export function paraExtracao(nota) {
  return {
    chave_acesso: soDigitos(nota.chave),
    data_compra: nota.dataCompra,
    valor_total: totais(nota).valorTotal.toFixed(2),
    cnpj: soDigitos(nota.cnpj),
    nome_estabelecimento: nota.estabelecimento.trim(),
    metodo_pag: nota.pagamento.trim(),
    itens: nota.itens.map(i => ({
      descricao: i.descricao.trim(),
      un: toNum(i.quantidade).toFixed(3),
      valor_unitario: toNum(i.valorUnitario).toFixed(2),
      valor_total: toNum(i.valorTotal).toFixed(2),
    })),
  }
}

// Produto devolvido pela extração -> estado editável da tela "Confirmar produtos".
export const produtoDaExtracao = p => ({
  n_item: p.n_item, descricao: p.descricao,
  nome: p.nome || '', marca: p.marca || '', alimenticio: !!p.alimenticio, precisa_revisao: !!p.precisa_revisao,
  un: p.un, valor_unitario: p.valor_unitario, valor_total: p.valor_total,
  categoria_id: null, sugestao: null, categoriaManual: false, editado: false,
})

// Sem a LLM (falha de extração): o nome vem da descrição e o usuário revisa tudo.
export const produtosSemLLM = nota => paraExtracao(nota).itens.map((i, k) => produtoDaExtracao({
  ...i, n_item: k + 1, nome: i.descricao.slice(0, LIMITES.nome), marca: '', alimenticio: true, precisa_revisao: true,
}))

// Problemas da tela "Confirmar produtos".
export function errosProdutos(produtos) {
  const e = []
  const alimentos = produtos.filter(p => p.alimenticio)
  if (!alimentos.length) e.push('Marque pelo menos um item como alimentar: só os alimentos são salvos.')
  alimentos.forEach(p => {
    const nome = p.nome.trim(), marca = p.marca.trim()
    if (!nome) e.push(`Item ${p.n_item}: informe o nome do produto.`)
    else if (nome.length > LIMITES.nome) e.push(`Item ${p.n_item}: o nome pode ter até ${LIMITES.nome} caracteres.`)
    if (marca.length > LIMITES.marca) e.push(`Item ${p.n_item}: a marca pode ter até ${LIMITES.marca} caracteres.`)
  })
  return e
}

// Produto -> entrada do classificador (ProdutoClassificarSerializer). Valores não vão para o modelo.
export const paraClassificacao = p => ({
  n_item: p.n_item,
  nome: p.alimenticio ? p.nome.trim() || null : null,
  descricao: p.descricao,
  alimenticio: p.alimenticio,
})

// Nota + produtos no formato do ConfirmarNotaSerializer (POST /api/notas/confirmar/).
// Todos os itens vão juntos (o backend valida o total com eles); só os alimentícios são gravados.
export function paraConfirmacao(nota, produtos) {
  const { itens, ...dadosNota } = paraExtracao(nota)
  return {
    nota: dadosNota,
    produtos: produtos.map(p => ({
      n_item: p.n_item,
      descricao: p.descricao,
      nome: p.alimenticio ? p.nome.trim() : '',
      marca: p.alimenticio ? p.marca.trim() : '',
      alimenticio: p.alimenticio,
      un: p.un,
      valor_unitario: p.valor_unitario,
      valor_total: p.valor_total,
      categoria_id: p.alimenticio ? p.categoria_id : null,
    })),
  }
}
