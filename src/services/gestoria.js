// Chamadas à API do GestorIA (backend Django em geladeira_virtual) e conversão das notas para o formato das telas.
import api from './api.js'
import { fmtCnpj } from '../lib/nfce.js'

const num = v => Number(v) || 0
const lista = d => (Array.isArray(d) ? d : d?.results || [])
const periodo = ({ inicio, fim } = {}) => ({ params: { ...(inicio && { inicio }), ...(fim && { fim }) } })

// Limite de itens por chamada do classificador (CLASSIFICADOR_MAX_ITENS no backend).
const MAX_CLASSIFICAR = 100

// ---------- Cadastro da nota ----------

// Nota fictícia gerada pelo serviço gerador_de_compras (XML convertido em JSON pelo backend).
export const lerNfce = () => api.get('/leitura-qrcode/nfce/').then(r => r.data)

// LLM de extração: devolve { nota, produtos } com nome, marca e alimentício. Nada é gravado.
export const extrairProdutos = nota => api.post('/api/produtos/extrair/', nota).then(r => r.data)

// Classificador local (Ollama). Envia em lotes e junta o resultado pelo n_item. Nada é gravado.
export async function classificarProdutos(produtos) {
  const respostas = []
  for (let i = 0; i < produtos.length; i += MAX_CLASSIFICAR) {
    const { data } = await api.post('/api/produtos/classificar/', { produtos: produtos.slice(i, i + MAX_CLASSIFICAR) })
    respostas.push(data)
  }
  const resumo = {}
  respostas.forEach(r => Object.entries(r.resumo || {}).forEach(([k, v]) => { resumo[k] = (resumo[k] || 0) + v }))
  return { produtos: respostas.flatMap(r => r.produtos), resumo }
}

export const listarCategorias = () => api.get('/api/categorias/').then(r => lista(r.data))

// Grava a nota e os produtos alimentícios do usuário logado.
export const confirmarNota = dados => api.post('/api/notas/confirmar/', dados).then(r => r.data)

// ---------- Listagem e dashboard ----------

export const listarNotas = p => api.get('/api/notas/', periodo(p)).then(r => lista(r.data))
export const detalharNota = chave => api.get(`/api/notas/${encodeURIComponent(chave)}/`).then(r => r.data)
export const dashboard = p => api.get('/api/dashboard/', periodo(p)).then(r => r.data)

// ---------- Perfil ----------

export const atualizarPerfil = dados => api.patch('/auth/users/me/', dados).then(r => r.data)

// ---------- Utilitários ----------

// Executa fn para cada item com no máximo `limite` chamadas ao mesmo tempo.
export async function emParalelo(itens, fn, limite = 6) {
  const saida = new Array(itens.length)
  let proximo = 0
  const trabalhador = async () => {
    while (proximo < itens.length) { const k = proximo++; saida[k] = await fn(itens[k]) }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador))
  return saida
}

// Nota da API (item da listagem + detalhe com produtos) -> formato usado por lib/finance.js, Notas e Chatbot.
// "total" é o gasto com alimentos (soma dos produtos salvos); "totalCupom" é o total impresso no cupom.
export function notaDaApi(item, detalhe) {
  const d = detalhe || item
  const nome = (d.nome_estabelecimento || '').trim()
  return {
    id: d.chave_acesso,
    chave: d.chave_acesso,
    est: nome || (d.cnpj ? 'CNPJ ' + fmtCnpj(d.cnpj) : 'Estabelecimento não informado'),
    cnpj: d.cnpj || '',
    date: d.data_compra,
    pay: d.metodo_pag || '',
    total: num(d.total_alimentos),
    totalCupom: num(d.valor_total),
    qtdProdutos: d.qtd_produtos ?? 0,
    items: (detalhe?.produtos || []).map(p => ({
      id: p.id,
      name: p.nome,
      marca: p.marca && p.marca !== 'nao_identificada' ? p.marca : '',
      cat: p.categoria,
      catId: p.categoria_id,
      qty: num(p.un),
      unit: '',
      unitPrice: num(p.valor_unitario),
      total: num(p.valor_total),
    })),
  }
}
