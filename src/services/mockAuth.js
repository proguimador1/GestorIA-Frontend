// Autenticação local de demonstração (VITE_MOCK_AUTH=true). Substitui a API para testar sem backend.
// Atenção: guarda as senhas no navegador, sem criptografia. Use apenas para desenvolvimento.
const KEY = '@GestorIA:mockUsers'
const lista = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
const erro = m => Object.assign(new Error(m), { userMessage: m })
const espera = () => new Promise(r => setTimeout(r, 400))

export const mockAuth = {
  async register({ email, nome_completo, password, re_password }) {
    await espera()
    if (password !== re_password) throw erro('As senhas não coincidem.')
    if (password.length < 8) throw erro('A senha deve ter no mínimo 8 caracteres.')
    const us = lista()
    if (us.some(u => u.email === email.toLowerCase())) throw erro('Já existe uma conta com este e-mail.')
    localStorage.setItem(KEY, JSON.stringify([...us, { email: email.toLowerCase(), nome: nome_completo, password }]))
  },
  async login({ email, password }) {
    await espera()
    const u = lista().find(x => x.email === email.toLowerCase() && x.password === password)
    if (!u) throw erro('E-mail ou senha incorretos.')
    return { access: 'mock.' + Date.now(), refresh: 'mock-refresh', nome: u.nome }
  },
  async requestReset({ email }) { await espera(); if (!email) throw erro('Informe o e-mail.') },
  async confirmReset({ new_password }) { await espera(); if (new_password.length < 8) throw erro('A senha deve ter no mínimo 8 caracteres.') },
}
