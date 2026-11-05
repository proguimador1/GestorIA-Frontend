// Converte as respostas de erro do Django REST Framework em uma lista de frases para a tela.
// O DRF devolve erros aninhados: {"itens": [{}, {"non_field_errors": ["..."]}]}, {"nota": {"valor_total": ["..."]}} etc.

const ROTULOS = {
  nota: 'Nota', itens: 'Itens', produtos: 'Produtos',
  chave_acesso: 'Chave de acesso', data_compra: 'Data da compra', valor_total: 'Valor total',
  cnpj: 'CNPJ', nome_estabelecimento: 'Estabelecimento', metodo_pag: 'Forma de pagamento',
  descricao: 'Descrição', un: 'Quantidade', valor_unitario: 'Valor unitário',
  nome: 'Nome', marca: 'Marca', categoria_id: 'Categoria', n_item: 'Nº do item', alimenticio: 'Tipo',
  email: 'E-mail', password: 'Senha', re_password: 'Confirmação de senha', nome_completo: 'Nome completo',
  new_password: 'Nova senha', inicio: 'Data inicial', fim: 'Data final',
}
const GERAIS = new Set(['non_field_errors', 'detail'])
const LISTAS_DE_ITENS = new Set(['itens', 'produtos'])

const juntar = (a, b) => (a && b ? `${a} › ${b}` : a || b)

function listar(dado, prefixo = '', chave = '') {
  if (dado == null) return []
  if (typeof dado === 'string' || typeof dado === 'number') return [prefixo ? `${prefixo}: ${dado}` : String(dado)]
  if (Array.isArray(dado)) {
    // Lista de itens (um objeto de erros por item, vazio quando o item está certo) ou lista de mensagens.
    return dado.flatMap((v, i) => v && typeof v === 'object' && !Array.isArray(v)
      ? listar(v, LISTAS_DE_ITENS.has(chave) ? `Item ${i + 1}` : prefixo)
      : listar(v, prefixo))
  }
  if (typeof dado === 'object') {
    return Object.entries(dado).flatMap(([k, v]) => {
      const p = GERAIS.has(k) ? prefixo : LISTAS_DE_ITENS.has(k) && Array.isArray(v) && v.some(x => x && typeof x === 'object') ? prefixo : juntar(prefixo, ROTULOS[k] || k)
      return listar(v, p, k)
    })
  }
  return []
}

// Lista de mensagens de um erro do axios. Vazia quando não há resposta com conteúdo útil.
export function errosApi(error) {
  const res = error?.response
  if (!res) return []
  const { data } = res
  if (!data || typeof data !== 'object') return []
  return listar(data)
}
