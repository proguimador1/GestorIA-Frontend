// Cliente HTTP (axios) para a API de autenticação. Baseado no código enviado em GestorIA-Frontend-feature-auth.
import axios from 'axios'

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
  500: 'Erro interno do servidor. Tente novamente mais tarde.',
}

function mensagem(error) {
  const { response } = error
  if (!response) return 'Não foi possível conectar ao servidor.'
  const { status, data } = response
  if (status === 400 && data && typeof data === 'object' && !data.detail) {
    const v = data[Object.keys(data)[0]]
    const m = Array.isArray(v) ? v[0] : v
    if (m) return m
  }
  if (data?.detail) return data.detail
  return ERROS[status] || 'Ocorreu um erro inesperado.'
}

api.interceptors.response.use(r => r, error => {
  error.userMessage = mensagem(error)
  // Sessão expirada em rota protegida: limpa as chaves e volta ao login (a rota usa hash).
  if (error.response?.status === 401 && localStorage.getItem(KEYS.token) && !PUBLICAS.includes(limpa(error.config?.url))) {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
    window.location.hash = '#/login'
  }
  return Promise.reject(error)
})

export default api
