// Estado global: notas e dashboards vindos da API, filtros da interface (F), rascunho da nota, chat, aviso e modal.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { colorOf } from '../data/seed.js'
import { useAuth } from './AuthContext.jsx'
import { createFinance } from '../lib/finance.js'
import { add, today } from '../lib/utils.js'
import { dashboard, detalharNota, emParalelo, excluirNota, listarCategorias, listarNotas, notaDaApi } from '../services/gestoria.js'

const WELCOME = [{ from: 'bot', t: 'Oi! Eu consulto as suas notas cadastradas e respondo com números. Escolha uma sugestão ou escreva sua pergunta.' }]
const SEM_DADOS = { notes: [], carregando: false, erro: null }

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const { user, signed, mock } = useAuth()
  // Sem backend (modo de demonstração do login), nenhuma chamada de dados é feita.
  const ativo = signed && !mock

  const [F, setFState] = useState({ mode: 'month', anchor: today(), from: add(today(), -29), to: today(), cat: '', est: '', tab: 'visao', line: 'dia', bar: 'total', q: '', all: false, open: null })
  const [draft, setDraft] = useState(null)
  const [chat, setChat] = useState(WELCOME)
  const [toastMsg, setToastMsg] = useState(null)
  const [modal, setModal] = useState(null)
  const timer = useRef()
  // Diálogo de confirmação (components/Overlays.jsx › Confirm): confirmar({ titulo, destaque, texto, confirmar, cancelar, perigo })
  // devolve uma Promise que resolve true (confirmou) ou false (cancelou, Esc, clique fora ou troca de tela).
  const [dialogo, setDialogo] = useState(null)
  const dialogoRef = useRef(null)
  const responderDialogo = useCallback(ok => {
    const d = dialogoRef.current
    if (!d) return
    dialogoRef.current = null; setDialogo(null); d.resolver(ok)
  }, [])
  const confirmar = useCallback(opcoes => new Promise(resolver => {
    dialogoRef.current?.resolver(false) // um diálogo novo cancela o anterior
    dialogoRef.current = { ...opcoes, resolver }
    setDialogo(dialogoRef.current)
  }), [])

  const [dados, setDados] = useState(SEM_DADOS)
  const [dash, setDash] = useState({ chave: '', atual: null, anterior: null, geral: null, erro: null })
  const [categorias, setCategorias] = useState([])
  // Incrementado depois de salvar uma nota (ou em "Tentar novamente") para buscar tudo de novo.
  const [versao, setVersao] = useState(0)
  // Detalhe de cada nota (com produtos) por chave de acesso. As notas não mudam depois de salvas.
  const detalhes = useRef(new Map())

  const setF = useCallback(p => setFState(f => ({ ...f, ...p })), [])
  const recarregar = useCallback(() => setVersao(v => v + 1), [])
  // Exclui a nota no backend, tira da tela na hora e busca de novo listas, dashboards e números do cabeçalho.
  const removerNota = useCallback(async chave => {
    await excluirNota(chave)
    detalhes.current.delete(chave)
    setDados(d => ({ ...d, notes: d.notes.filter(n => n.id !== chave) }))
    recarregar()
  }, [recarregar])

  // Períodos do filtro (dependem só de F). A janela de notas cobre o período anterior e o atual,
  // para as comparações "contra o período anterior".
  const periodos = useMemo(() => { const p = createFinance({ notes: [] }, F); return { r: p.range(), pr: p.prevRange() } }, [F])
  const { r, pr } = periodos
  const janela = F.all ? null : { inicio: pr[0], fim: r[1] }
  const chaveJanela = janela ? `${janela.inicio}|${janela.fim}` : 'tudo'
  const chaveDash = `${r.join('|')}|${pr.join('|')}`

  // Troca de usuário (login/logout): limpa tudo o que veio da API.
  useEffect(() => {
    detalhes.current = new Map()
    setDados(SEM_DADOS)
    setDash({ chave: '', atual: null, anterior: null, geral: null, erro: null })
    setCategorias([])
    setDraft(null)
    setChat(WELCOME)
  }, [user?.email])

  // Notas da janela: GET /api/notas/ e, para as que ainda não estão no cache, GET /api/notas/<chave>/.
  useEffect(() => {
    if (!ativo) return
    let vivo = true
    setDados(d => ({ ...d, carregando: true, erro: null }))
    ;(async () => {
      try {
        const lista = await listarNotas(janela || {})
        const faltam = lista.filter(n => !detalhes.current.has(n.chave_acesso))
        await emParalelo(faltam, async n => { detalhes.current.set(n.chave_acesso, await detalharNota(n.chave_acesso)) })
        if (vivo) setDados({ notes: lista.map(n => notaDaApi(n, detalhes.current.get(n.chave_acesso))), carregando: false, erro: null })
      } catch (e) {
        if (vivo) setDados(d => ({ ...d, carregando: false, erro: e.userMessage || 'Não foi possível carregar as notas.' }))
      }
    })()
    return () => { vivo = false }
  }, [ativo, chaveJanela, versao])

  // Dashboard do período atual e do anterior: GET /api/dashboard/?inicio=&fim=
  useEffect(() => {
    if (!ativo) return
    let vivo = true
    Promise.all([dashboard({ inicio: r[0], fim: r[1] }), dashboard({ inicio: pr[0], fim: pr[1] })])
      .then(([atual, anterior]) => vivo && setDash(d => ({ ...d, chave: chaveDash, atual, anterior, erro: null })))
      .catch(e => vivo && setDash(d => ({ ...d, erro: e.userMessage || 'Não foi possível carregar o dashboard.' })))
    return () => { vivo = false }
  }, [ativo, chaveDash, versao])

  // Totais de todo o histórico (cabeçalho): GET /api/dashboard/ sem datas.
  useEffect(() => {
    if (!ativo) return
    let vivo = true
    dashboard().then(geral => vivo && setDash(d => ({ ...d, geral }))).catch(() => {})
    return () => { vivo = false }
  }, [ativo, versao])

  // Categorias cadastradas (seletor do Cadastro, filtros e cores): GET /api/categorias/
  const carregarCategorias = useCallback(async () => { const c = await listarCategorias(); setCategorias(c); return c }, [])
  useEffect(() => { if (ativo) carregarCategorias().catch(() => {}) }, [ativo, carregarCategorias])

  const notes = dados.notes
  // Números do cabeçalho (notas e produtos de todo o histórico) vêm do dashboard sem datas.
  const S = useMemo(() => ({
    notes,
    catalog: dash.geral?.qtd_produtos ?? 0,
    qtdNotas: dash.geral?.qtd_notas ?? 0,
    totalGeral: Number(dash.geral?.total_alimentos || 0),
    user: { name: user?.nome || user?.email || 'Usuário', email: user?.email || '' },
  }), [notes, dash.geral, user?.nome, user?.email])
  const fin = useMemo(() => createFinance(S, F), [S, F])
  // Estabelecimentos das notas carregadas (o "id" é o próprio nome).
  const ests = useMemo(() => [...new Set(notes.map(n => n.est))].sort((a, b) => a.localeCompare(b)).map(name => ({ id: name, name })), [notes])
  // Categorias para filtros e cores: as cadastradas no backend e as que aparecem nas notas.
  const todasCats = useMemo(() => [...new Set([...categorias.map(c => c.categoria), ...fin.allCats()])].sort((a, b) => a.localeCompare(b)), [categorias, fin])
  const catColor = useCallback(c => colorOf(c, todasCats), [todasCats])

  // Dashboard só vale para o período que está na tela (evita mostrar números do período anterior durante a troca).
  const dashAtual = dash.chave === chaveDash ? dash.atual : null
  const dashAnterior = dash.chave === chaveDash ? dash.anterior : null

  const toast = useCallback(m => { setToastMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToastMsg(null), 3200) }, [])
  const openModal = useCallback(node => setModal(node), [])
  const closeModal = useCallback(() => setModal(null), [])

  const value = {
    S, F, setF, fin, ests, todasCats, catColor, categorias, carregarCategorias,
    dashAtual, dashAnterior, erroDash: dash.erro, carregando: dados.carregando, erroDados: dados.erro, recarregar, removerNota, versao, mock,
    draft, setDraft, chat, setChat, toast, toastMsg, modal, openModal, closeModal, syncing: dados.carregando,
    dialogo, confirmar, responderDialogo,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
