// Histórico de conversas do chatbot, salvo no navegador (localStorage, chave gestoria.chats.v1).
// Cada chat guarda as mensagens, um título gerado pelo assunto da conversa e a memória (ctx: último período, assunto e produto).
import { useCallback, useEffect, useState } from 'react'
import { WELCOME } from '../lib/chat.js'

const KEY = 'gestoria.chats.v1'
export const NOVO_TITULO = 'Novo chat'
const novoChat = () => ({ id: 'c' + Date.now() + Math.random().toString(36).slice(2, 6), title: NOVO_TITULO, msgs: [{ from: 'bot', t: WELCOME }], ctx: {}, at: Date.now() })
const vazio = c => c.msgs.every(m => m.from === 'bot')

function carregar() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY))
    if (d?.chats?.length) return { chats: d.chats, ativo: d.chats.some(c => c.id === d.ativo) ? d.ativo : d.chats[0].id }
  } catch { /* sem histórico salvo */ }
  const c = novoChat()
  return { chats: [c], ativo: c.id }
}

export function useChats() {
  const [st, setSt] = useState(carregar)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* armazenamento indisponível */ } }, [st])

  const chat = st.chats.find(c => c.id === st.ativo) || st.chats[0]
  const lista = [...st.chats].sort((a, b) => b.at - a.at)

  // Novo chat: se o atual ainda está vazio, apenas continua nele.
  const novo = useCallback(() => setSt(s => {
    const atual = s.chats.find(c => c.id === s.ativo)
    if (atual && vazio(atual)) return s
    const c = novoChat()
    return { chats: [c, ...s.chats], ativo: c.id }
  }), [])
  const abrir = useCallback(id => setSt(s => ({ ...s, ativo: id })), [])
  const excluir = useCallback(id => setSt(s => {
    const resto = s.chats.filter(c => c.id !== id)
    if (!resto.length) { const c = novoChat(); return { chats: [c], ativo: c.id } }
    return { chats: resto, ativo: s.ativo === id ? [...resto].sort((a, b) => b.at - a.at)[0].id : s.ativo }
  }), [])
  // Acrescenta mensagens a um chat; o título só é definido na primeira pergunta com assunto reconhecido.
  const atualizar = useCallback((id, f) => setSt(s => ({ ...s, chats: s.chats.map(c => c.id === id ? { ...c, ...f(c), at: Date.now() } : c) })), [])
  const limparTudo = useCallback(() => { const c = novoChat(); setSt({ chats: [c], ativo: c.id }) }, [])

  return { chat, lista, ativo: chat.id, novo, abrir, excluir, atualizar, limparTudo }
}
