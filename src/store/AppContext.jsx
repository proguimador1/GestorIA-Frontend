// Estado global: dados persistentes (S), filtros da interface (F), rascunho da nota, chat, aviso e modal.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { BASE_NOTES, colorOf, ensureEst } from '../data/seed.js'
import { paraNotaDoApp } from '../lib/nfce.js'
import { useAuth } from './AuthContext.jsx'
import { createFinance } from '../lib/finance.js'
import { add, brl, today } from '../lib/utils.js'

// Só o que o usuário altera é salvo no navegador: notas cadastradas (added), notas da base excluídas (removed),
// estabelecimentos novos (estNovos) e perfil. A base (src/data/notas.json) não é copiada para o localStorage.
const KEY = 'gestoria.v3'
const fresh = () => ({ added: [], removed: [], estNovos: [], user: { name: 'Marina Duarte', email: 'marina@exemplo.com' } })
const load = () => {
  let p
  try { p = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY)) } } catch { p = fresh() }
  p.estNovos.forEach(e => ensureEst(e.name, e.cnpj)) // recoloca na lista os mercados de notas cadastradas
  return p
}
const WELCOME = [{ from: 'bot', t: 'Oi! Eu consulto as suas notas cadastradas e respondo com números. Escolha uma sugestão ou escreva sua pergunta.' }]

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [P, setP] = useState(load)
  // S é a visão completa dos dados: notas da base (menos as excluídas) + notas cadastradas.
  const notes = useMemo(() => { const rm = new Set(P.removed); return [...BASE_NOTES.filter(n => !rm.has(n.id)), ...P.added] }, [P.added, P.removed])
  // Itens catalogados: quantidade de produtos diferentes (pelo nome) em todas as notas. Repetir a compra de um produto não aumenta o número.
  const catalog = useMemo(() => new Set(notes.flatMap(n => n.items.map(i => i.name.trim().toLowerCase()))).size, [notes])
  const S = useMemo(() => ({ notes, catalog, user: P.user }), [notes, catalog, P.user])
  const [F, setFState] = useState({ mode: 'month', anchor: today(), from: add(today(), -29), to: today(), cat: '', est: '', tab: 'visao', line: 'dia', bar: 'total', q: '', all: false, open: null })
  const [draft, setDraft] = useState(null)
  const [chat, setChat] = useState(WELCOME)
  const [toastMsg, setToastMsg] = useState(null)
  const [modal, setModal] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const timer = useRef()

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(P)) }, [P])
  // Nome e e-mail da conta autenticada passam a ser os dados do perfil.
  useEffect(() => {
    if (user?.email) setP(p => ({ ...p, user: { name: user.nome || p.user.name, email: user.email } }))
  }, [user?.email, user?.nome])
  const setF = useCallback(p => setFState(f => ({ ...f, ...p })), [])
  const fin = useMemo(() => createFinance(S, F), [S, F])
  const catColor = useCallback(c => colorOf(c, fin.allCats()), [fin])

  const toast = useCallback(m => { setToastMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToastMsg(null), 2600) }, [])
  const openModal = useCallback(node => setModal(node), [])
  const closeModal = useCallback(() => setModal(null), [])

  // Grava a nota confirmada no Cadastro. Recusa nota já cadastrada (mesma chave de acesso).
  const confirmNote = nota => {
    const chave = nota.chave.replace(/\D/g, '')
    if (notes.some(n => n.chave === chave)) { toast('Esta nota já foi cadastrada (mesma chave de acesso).'); return false }
    const { razaoSocial, cnpj } = nota.emitente
    const est = ensureEst(razaoSocial.trim(), cnpj)
    const novo = paraNotaDoApp(nota, est)
    setP(p => ({
      ...p,
      added: [...p.added, novo],
      estNovos: est.startsWith('u') && !p.estNovos.some(e => e.cnpj === cnpj) ? [...p.estNovos, { name: razaoSocial.trim(), cnpj }] : p.estNovos,
    }))
    setDraft(null); setSyncing(true); setTimeout(() => setSyncing(false), 900)
    toast(`Nota registrada: ${novo.items.length} itens · ${brl(novo.total)}`)
    return true
  }
  const removeNote = id => setP(p => p.added.some(n => n.id === id) ? { ...p, added: p.added.filter(n => n.id !== id) } : { ...p, removed: [...p.removed, id] })
  const setUser = u => setP(p => ({ ...p, user: u }))
  const resetAll = () => { if (window.confirm('Restaurar os dados de demonstração?')) { setP(fresh()); toast('Dados restaurados') } }

  const value = { S, removeNote, setUser, F, setF, fin, draft, setDraft, catColor, chat, setChat, toast, toastMsg, modal, openModal, closeModal, syncing, confirmNote, resetAll }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
