// Autenticação por JWT. Baseado no AuthContext do código enviado, adaptado para HashRouter e para o modo de demonstração.
import { createContext, useContext, useState } from 'react'
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

  async function cadastro(email, nome_completo, password, re_password) {
    if (MOCK) await mockAuth.register({ email, nome_completo, password, re_password })
    else await api.post('/auth/users/', { email, nome_completo, password, re_password })
  }

  async function login(email, password) {
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

  const solicitarRecuperacao = email => MOCK ? mockAuth.requestReset({ email }) : api.post('/auth/users/reset_password/', { email })
  const redefinirSenha = (uid, token, new_password) => MOCK ? mockAuth.confirmReset({ new_password }) : api.post('/auth/users/reset_password_confirm/', { uid, token, new_password })

  return <AuthContext.Provider value={{ signed: !!user, user, login, logout, cadastro, solicitarRecuperacao, redefinirSenha, mock: MOCK }}>{children}</AuthContext.Provider>
}
