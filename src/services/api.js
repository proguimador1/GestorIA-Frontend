// Cliente HTTP (axios) para a API Django (autenticação, notas e dashboard).
import axios from 'axios'
import { errosApi } from '../lib/erros.js'

export const KEYS = { token: '@GestorIA:token', refresh: '@GestorIA:refresh', user: '@GestorIA:user' }

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000' })

// Rotas que não recebem o token. Comparação sem barras nas pontas, para tolerar "/x/" e "x".
const PUBLICAS = ['auth/jwt/create', 'auth/users', 'auth/users/reset_password', 'auth/users/reset_password_confirm']
const limpa = u => (u || '').replace(/^\/+|\/+$/g, '')

api.interceptors.request.use(config => {
  const token = localStorage.getItem(KEYS.token)
  if (token && !PUBLICAS.includes(limpa(config.url))) config.headers.Authorization = `Bearer ${token}`
  return config
})

const ERROS = {
  400: 'Verifique os dados informados.',
  401: 'E-mail ou senha incorretos.',
  403: 'Você não tem permissão para essa ação.',
  404: 'Recurso não encontrado.',
  409: 'Este registro já existe.',
  500: 'Erro interno do servidor. Tente novamente mais tarde.',
  502: 'Um serviço do servidor não respondeu. Tente novamente.',
}

function mensagem(error) {
  const { response } = error
  if (!response) return 'Não foi possível conectar ao servidor.'
  const { status, data } = response
  if (data && typeof data === 'object' && typeof data.detail === 'string') return data.detail
  if (status === 400 && error.erros.length) return error.erros.join(' ')
  return ERROS[status] || 'Ocorreu um erro inesperado.'
}

api.interceptors.response.use(r => r, error => {
  error.erros = errosApi(error) // lista de mensagens (400 do DRF), usada nas telas do Cadastro
  error.userMessage = mensagem(error)
  // Sessão expirada em rota protegida: limpa as chaves e volta ao login (a rota usa hash).
  if (error.response?.status === 401 && localStorage.getItem(KEYS.token) && !PUBLICAS.includes(limpa(error.config?.url))) {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
    window.dispatchEvent(new Event('gestoria:sessao-expirada')) // avisa o AuthContext
    window.location.hash = '#/login'
  }
  return Promise.reject(error)
})

export default api
