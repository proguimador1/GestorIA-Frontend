// Estado global: dados persistentes (S), filtros da interface (F), rascunho da nota, chat, aviso e modal.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SEED_NOTES } from '../data/seed.js'
import { createFinance } from '../lib/finance.js'
import { brl, sum, today } from '../lib/utils.js'

const KEY = 'gestoria.v1'
const fresh = () => ({ notes: structuredClone(SEED_NOTES), catalog: 128, used: [], user: { name: 'Marina Duarte', email: 'marina@exemplo.com' } })
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || fresh() } catch { return fresh() } }
const WELCOME = [{ from: 'bot', t: 'Oi! Eu consulto as suas notas cadastradas e respondo com números. Escolha uma sugestão ou escreva sua pergunta.' }]

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [S, setS] = useState(load)
  const [F, setFState] = useState({ mode: 'month', anchor: today(), cat: '', est: '', tab: 'visao', line: 'dia', bar: 'total', q: '', all: false, open: null })
  const [draft, setDraft] = useState(null)
  const [cadTab, setCadTab] = useState('webcam')
  const [chat, setChat] = useState(WELCOME)
  const [toastMsg, setToastMsg] = useState(null)
  const [modal, setModal] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const timer = useRef()

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(S)) }, [S])
  const setF = useCallback(p => setFState(f => ({ ...f, ...p })), [])
  const fin = useMemo(() => createFinance(S, F), [S, F])

  const toast = useCallback(m => { setToastMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToastMsg(null), 2600) }, [])
  const openModal = useCallback(node => setModal(node), [])
  const closeModal = useCallback(() => setModal(null), [])

  const confirmNote = () => {
    const d = draft, t = sum(d.items.map(i => i.total))
    setS(s => ({
      ...s,
      notes: [...s.notes, { id: 'n' + Date.now(), nf: d.nf, est: d.est, date: d.date, items: d.items, total: t }],
      used: d.sample !== undefined ? [...s.used, d.sample] : s.used,
      catalog: s.catalog + d.items.length,
    }))
    setDraft(null); setSyncing(true); setTimeout(() => setSyncing(false), 900)
    toast(`Nota registrada: ${d.items.length} itens · ${brl(t)}`)
  }
  const resetAll = () => { if (window.confirm('Restaurar os dados de demonstração?')) { setS(fresh()); toast('Dados restaurados') } }

  const value = { S, setS, F, setF, fin, draft, setDraft, cadTab, setCadTab, chat, setChat, toast, toastMsg, modal, openModal, closeModal, syncing, confirmNote, resetAll }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
