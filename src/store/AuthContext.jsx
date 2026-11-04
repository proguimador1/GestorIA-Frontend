// Autenticação por JWT. Baseado no AuthContext do código enviado, adaptado para HashRouter e para o modo de demonstração.
import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { KEYS } from '../services/api.js'
import { mockAuth } from '../services/mockAuth.js'

const MOCK = import.meta.env.VITE_MOCK_AUTH === 'true'
const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const lerUsuario = () => {
  if (!localStorage.getItem(KEYS.token)) return null
  try { return JSON.parse(localStorage.getItem(KEYS.user)) || {} } catch { return {} }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(lerUsuario)
  const navigate = useNavigate()

  // Sessão expirada (401 em rota protegida): o interceptor limpa o localStorage e avisa por evento.
  useEffect(() => {
    const sair = () => setUser(null)
    window.addEventListener('gestoria:sessao-expirada', sair)
    return () => window.removeEventListener('gestoria:sessao-expirada', sair)
  }, [])

  // Ao abrir o app, confirma no backend que o token guardado ainda vale e atualiza o nome.
  useEffect(() => {
    if (MOCK || !localStorage.getItem(KEYS.token)) return
    api.get('/auth/users/me/').then(({ data }) => {
      setUser(u => {
        if (!u) return u
        const novo = { ...u, nome: data.nome_completo || u.nome }
        localStorage.setItem(KEYS.user, JSON.stringify(novo))
        return novo
      })
    }).catch(() => { /* 401 já é tratado pelo interceptor */ })
  }, [])

  async function cadastro(email, nome_completo, password, re_password) {
    email = email.trim().toLowerCase()
    if (MOCK) await mockAuth.register({ email, nome_completo, password, re_password })
    else await api.post('/auth/users/', { email, nome_completo, password, re_password })
  }

  async function login(email, password) {
    email = email.trim().toLowerCase()
    let access, refresh, nome
    if (MOCK) ({ access, refresh, nome } = await mockAuth.login({ email, password }))
    else {
      const { data } = await api.post('/auth/jwt/create/', { email, password })
      access = data.access; refresh = data.refresh
      localStorage.setItem(KEYS.token, access) // necessário para a consulta seguinte
      try { nome = (await api.get('/auth/users/me/')).data.nome_completo } catch { /* o nome é opcional */ }
    }
    const u = { email, nome }
    localStorage.setItem(KEYS.token, access)
    localStorage.setItem(KEYS.refresh, refresh)
    localStorage.setItem(KEYS.user, JSON.stringify(u))
    setUser(u)
    navigate('/inicio')
  }

  async function logout() {
    const refresh = localStorage.getItem(KEYS.refresh)
    try { if (refresh && !MOCK) await api.post('/auth/jwt/logout/', { refresh }) }
    catch (e) { console.error('Não foi possível invalidar o token no backend:', e) }
    finally {
      Object.values(KEYS).forEach(k => localStorage.removeItem(k))
      setUser(null)
      navigate('/login')
    }
  }

  const solicitarRecuperacao = email => {
    email = email.trim().toLowerCase()
    return MOCK ? mockAuth.requestReset({ email }) : api.post('/auth/users/reset_password/', { email })
  }
  const redefinirSenha = (uid, token, new_password) => MOCK ? mockAuth.confirmReset({ new_password }) : api.post('/auth/users/reset_password_confirm/', { uid, token, new_password })

  return <AuthContext.Provider value={{ signed: !!user, user, login, logout, cadastro, solicitarRecuperacao, redefinirSenha, mock: MOCK }}>{children}</AuthContext.Provider>
}
