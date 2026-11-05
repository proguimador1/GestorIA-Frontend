import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHead from '../components/PageHead.jsx'
import { useApp } from '../store/AppContext.jsx'
import { classificarProdutos, confirmarNota, extrairProdutos, lerNfce } from '../services/gestoria.js'
import {
  LIMITES, editarItem, errosItem, errosProdutos, fmtCnpj, fmtNum, nfceParaNota, paraClassificacao, paraConfirmacao,
  paraExtracao, produtoDaExtracao, produtosSemLLM, toNum, totais, validarNota,
} from '../lib/nfce.js'
import { brl, dmy, sum } from '../lib/utils.js'

// Fluxo do Cadastro (draft.stage), uma nota por vez:
//   sem rascunho  -> leitura da nota (webcam ou "Simular leitura")
//   'nota'        -> pop-up: confirmar os dados da nota            -> POST /api/produtos/extrair/  (LLM)
//   'produtos'    -> confirmar alimentício ou não, nome e marca     -> POST /api/produtos/classificar/ (SLM local)
//   'categorias'  -> confirmar a categoria de cada alimento         -> POST /api/notas/confirmar/  (grava no banco)
// Nada é gravado antes do último passo.

const ETAPAS = [['nota', 'Nota'], ['produtos', 'Produtos'], ['categorias', 'Categorias'], ['salvar', 'Salvar']]
const MOTIVOS = {
  saida_invalida: 'O classificador não reconheceu este item.',
  categoria_nao_cadastrada: 'O grupo sugerido não tem categoria cadastrada.',
  nome_ausente: 'Item sem nome para classificar.',
}
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`
const listaErros = (err, padrao) => (err?.erros?.length ? err.erros : [err?.userMessage || padrao])

function Etapas({ atual }) {
  const k = ETAPAS.findIndex(e => e[0] === atual)
  return (
    <div className="fbar" aria-label="Etapas do cadastro">
      {ETAPAS.map(([id, t], i) => (
        <span key={id} className={'seg' + (i === k ? ' on' : '')} style={{ cursor: 'default', ...(i < k ? { color: 'var(--dg)', borderColor: 'var(--g)' } : {}) }}>
          {i + 1}. {t}{i < k ? ' ✓' : ''}
        </span>
      ))}
    </div>
  )
}

const Erros = ({ lista, titulo = 'Corrija antes de continuar:' }) => lista.length > 0 && (
  <div className="msg-err mt"><b>{titulo}</b><ul style={{ margin: '8px 0 0 18px' }}>{lista.map(e => <li key={e}>{e}</li>)}</ul></div>
)

export default function Cadastro() {
  const { draft, setDraft, toast, mock } = useApp()
  const [lendo, setLendo] = useState(false)
  const ocupado = useRef(false) // evita chamadas duplicadas (botão + leitura da câmera)

  // Consulta a NFC-e fictícia na API e converte a resposta para o formato do pop-up de confirmação.
  const lerNota = async () => {
    if (ocupado.current) return
    if (mock) return toast('Modo de demonstração: o cadastro de notas precisa da API (VITE_MOCK_AUTH=false).')
    ocupado.current = true; setLendo(true)
    try {
      const data = await lerNfce()
      const nota = nfceParaNota(data?.nfce ?? data)
      if (!nota) return toast('Nenhuma nota encontrada na leitura.')
      setDraft({ stage: 'nota', nota })
    } catch (e) {
      // O scrapping_module responde 500 depois de várias leituras seguidas (contador interno), até o servidor reiniciar.
      if (e.response?.status === 500) toast('A leitura falhou no servidor (erro 500). Se já foram feitas muitas leituras, reinicie o backend e tente de novo.')
      else toast(e.userMessage || e.message || 'Não foi possível ler a nota.')
    } finally { ocupado.current = false; setLendo(false) }
  }

  const emAndamento = draft && draft.stage !== 'nota'
  return (
    <>
      <PageHead eyebrow="Cadastro · Nota fiscal">{emAndamento ? 'Confira a nota antes de salvar' : 'Escaneie o QR code da sua nota fiscal'}</PageHead>
      {draft && <Etapas atual={draft.stage} />}
      {emAndamento ? (
        <div className="mt">{draft.stage === 'produtos' ? <Produtos /> : <Categorias />}</div>
      ) : (
        <div className="row mt">
          <div style={{ width: 425, flex: 'none' }}>
            <Camera ativa={!draft} onLeitura={lerNota} />
            <button className="btn dk" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={lerNota} disabled={!!draft || lendo}>{lendo ? 'Lendo nota…' : 'Simular leitura da nota'}</button>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="empty">Nenhuma nota lida ainda.<br />Aponte o QR Code da nota fiscal para a webcam.<br /><span className="mono" style={{ fontSize: 12 }}>Uma nota por vez</span></div>
          </div>
        </div>
      )}
      {draft?.stage === 'nota' && <Confirmacao />}
    </>
  )
}

// Webcam: abre ao entrar e fecha ao sair; detecta QR Code quando o navegador suporta.
function Camera({ ativa, onLeitura }) {
  const [camOn, setCamOn] = useState(false)
  const vid = useRef(null)
  const live = useRef(); live.current = { ativa, onLeitura }
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) return
    let stream, stop = false, timer
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(st => {
      if (stop) { st.getTracks().forEach(t => t.stop()); return }
      stream = st; setCamOn(true)
      if (vid.current) vid.current.srcObject = st
      if ('BarcodeDetector' in window) {
        const bd = new window.BarcodeDetector({ formats: ['qr_code'] })
        const tick = async () => {
          if (stop) return
          try { const c = await bd.detect(vid.current); if (c.length && live.current.ativa) { live.current.onLeitura(); return } } catch { /* ignora */ }
          timer = setTimeout(tick, 600)
        }
        tick()
      }
    }).catch(() => {})
    return () => { stop = true; clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()); setCamOn(false) }
  }, [])
  return (
    <div className="cam">
      <div className="lb mono"><i />Webcam {camOn ? 'ativa' : 'inativa'}</div>
      <video ref={vid} autoPlay muted playsInline />
      <div className="fr" /><div className="hint">Aponte o QR Code da nota fiscal para a webcam</div>
    </div>
  )
}

const Campo = ({ label, children, span }) => <div className="fld" style={span ? { gridColumn: `span ${span}` } : undefined}><label className="mono lab">{label}</label>{children}</div>

// Cabeçalho com os dados da nota, usado nas etapas Produtos e Categorias.
function CabecalhoNota({ nota }) {
  return (
    <header>
      <div>
        <b style={{ fontSize: 'var(--fs-md)' }}>{nota.estabelecimento || 'Estabelecimento não informado'}</b>
        <div className="lab" style={{ fontSize: 'var(--fs-xs)', marginTop: 4 }}>{nota.cnpj ? 'CNPJ ' + fmtCnpj(nota.cnpj) : 'CNPJ não informado'}{nota.pagamento ? ' · ' + nota.pagamento : ''}</div>
      </div>
      <div className="lab" style={{ textAlign: 'right' }}>
        {nota.dataCompra ? dmy(nota.dataCompra) : ''}
        <div className="mono" style={{ fontSize: 'var(--fs-xs)', marginTop: 4 }}>Chave {nota.chave.replace(/\D/g, '')}</div>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Etapa 1: pop-up de confirmação da nota (dados do estabelecimento e itens, todos editáveis).
// "Confirmar nota" envia a nota para a LLM de extração.
// ---------------------------------------------------------------------------
function Confirmacao() {
  const { draft, setDraft, toast } = useApp()
  const [erros, setErros] = useState([])
  const [falhaLLM, setFalhaLLM] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const ocupado = useRef(false)
  const novoVazio = { descricao: '', quantidade: '1', valorUnitario: '', valorTotal: '' }
  const [novo, setNovo] = useState(novoVazio)
  const corpo = useRef(null)
  const nota = draft.nota
  const t = totais(nota)

  // Enquanto o pop-up está aberto, a página de fundo não rola
  useEffect(() => { const o = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = o } }, [])

  const set = (campo, valor) => setDraft(d => ({ ...d, nota: { ...d.nota, [campo]: valor } }))
  const setItem = (k, campo, valor) => setDraft(d => ({ ...d, nota: { ...d.nota, itens: d.nota.itens.map((i, j) => j === k ? editarItem(i, campo, valor) : i) } }))
  const remover = k => setDraft(d => ({ ...d, nota: { ...d.nota, itens: d.nota.itens.filter((_, j) => j !== k) } }))
  const novoCalc = editarItem(novo, 'quantidade', novo.quantidade)
  const novoErros = errosItem(novoCalc)
  const adicionar = () => {
    if (novoErros.length) return toast('Preencha ' + novoErros.join(', ') + ' do novo item.')
    setDraft(d => ({ ...d, nota: { ...d.nota, itens: [...d.nota.itens, { ...novoCalc, key: 'n' + Date.now() }] } }))
    setNovo(novoVazio)
  }
  const mostrarErros = e => { setErros(e); if (e.length) setTimeout(() => corpo.current?.scrollTo({ top: corpo.current.scrollHeight, behavior: 'smooth' }), 0) }

  // POST /api/produtos/extrair/: a LLM devolve nome, marca e se o item é alimentício. Nada é gravado.
  const confirmar = async () => {
    const e = validarNota(nota)
    mostrarErros(e)
    if (e.length || ocupado.current) return
    ocupado.current = true; setEnviando(true); setFalhaLLM(false)
    try {
      const r = await extrairProdutos(paraExtracao(nota))
      setDraft(d => ({ ...d, stage: 'produtos', produtos: r.produtos.map(produtoDaExtracao), semLLM: false, classificador: null }))
    } catch (err) {
      const st = err.response?.status
      if (st === 502) setFalhaLLM(true)
      // A chave de acesso é única no banco inteiro. O gerador fictício devolve sempre a mesma chave ("1"),
      // então a partir da segunda nota é preciso trocar a chave no campo acima.
      else if (st === 409) mostrarErros([err.userMessage || 'Esta nota fiscal já foi cadastrada.', 'Se for uma nota nova do gerador fictício (que repete a chave), troque a chave de acesso no campo acima e confirme de novo.'])
      else mostrarErros(listaErros(err, 'Não foi possível processar a nota.'))
    } finally { ocupado.current = false; setEnviando(false) }
  }
  // Sem a LLM: o nome vem da descrição da nota e o usuário revisa cada item na próxima etapa.
  const seguirSemLLM = () => setDraft(d => ({ ...d, stage: 'produtos', produtos: produtosSemLLM(d.nota), semLLM: true, classificador: null }))

  const inp = (campo, props = {}) => <input value={nota[campo]} onChange={e => set(campo, e.target.value)} disabled={enviando} {...props} />

  return (
    <div className="popup" role="dialog" aria-modal="true" aria-labelledby="pop-tit">
      <div className="popup-box">
        <div className="popup-head">
          <div className="eyebrow mono">Cadastro · Etapa 1 de 4 · Confirmação da nota</div>
          <h2 id="pop-tit">Confira a leitura da nota fiscal</h2>
          <p className="lab">Confira os dados do estabelecimento e todos os itens lidos. Qualquer campo pode ser corrigido. Depois, a IA identifica o nome de cada produto.</p>
        </div>

        <div className="popup-body" ref={corpo}>
          <div className="card">
            <div className="ct-sm">Estabelecimento e nota</div>
            <div className="grid4">
              <Campo label="Nome do estabelecimento" span={2}>{inp('estabelecimento', { maxLength: LIMITES.estabelecimento })}</Campo>
              <Campo label="CNPJ">{inp('cnpj', { inputMode: 'numeric', placeholder: '00.000.000/0000-00' })}</Campo>
              <Campo label="Data da compra">{inp('dataCompra', { type: 'date' })}</Campo>
              <Campo label="Forma de pagamento">{inp('pagamento', { maxLength: LIMITES.pagamento, placeholder: 'Ex.: Cartão de débito' })}</Campo>
              <Campo label="Chave de acesso (até 44 dígitos)" span={3}>{inp('chave', { inputMode: 'numeric' })}</Campo>
            </div>
          </div>

          <div className="card mt">
            <div className="ct-sm">Itens da nota <span className="lab" style={{ fontSize: 'var(--fs-sm)', fontWeight: 400 }}>{plural(nota.itens.length, 'item', 'itens')}, na ordem do documento</span></div>
            <div className="scr">
              <table className="itab">
                <thead><tr><th>Nº</th><th>Descrição</th><th className="r">Qtd</th><th className="r">Valor unit. (R$)</th><th className="r">Valor total (R$)</th><th /></tr></thead>
                <tbody>
                  {nota.itens.map((i, k) => {
                    const bad = errosItem(i)
                    return (
                      <tr key={i.key} className={bad.length ? 'bad' : undefined} title={bad.length ? 'Verifique: ' + bad.join(', ') : undefined}>
                        <td className="lab" style={{ width: 34 }}>{k + 1}</td>
                        <td><input value={i.descricao} maxLength={LIMITES.descricao} onChange={e => setItem(k, 'descricao', e.target.value)} disabled={enviando} /></td>
                        <td style={{ width: 100 }}><input className="r" inputMode="decimal" value={i.quantidade} onChange={e => setItem(k, 'quantidade', e.target.value)} disabled={enviando} /></td>
                        <td style={{ width: 128 }}><input className="r" inputMode="decimal" value={i.valorUnitario} onChange={e => setItem(k, 'valorUnitario', e.target.value)} disabled={enviando} /></td>
                        <td style={{ width: 128 }}><input className="r" inputMode="decimal" value={i.valorTotal} onChange={e => setItem(k, 'valorTotal', e.target.value)} disabled={enviando} /></td>
                        <td style={{ width: 40 }}><button className="x" title="Excluir item" onClick={() => remover(k)} disabled={enviando}>×</button></td>
                      </tr>
                    )
                  })}
                  <tr className="addrow">
                    <td className="lab">+</td>
                    <td><input placeholder="Descrição do item *" value={novo.descricao} onChange={e => setNovo({ ...novo, descricao: e.target.value })} onKeyDown={e => e.key === 'Enter' && adicionar()} /></td>
                    <td><input className="r" inputMode="decimal" placeholder="Qtd *" value={novo.quantidade} onChange={e => setNovo({ ...novo, quantidade: e.target.value })} /></td>
                    <td><input className="r" inputMode="decimal" placeholder="0,00 *" value={novo.valorUnitario} onChange={e => setNovo({ ...novo, valorUnitario: e.target.value })} onKeyDown={e => e.key === 'Enter' && adicionar()} /></td>
                    <td><input className="r calc" readOnly tabIndex={-1} value={novoCalc.valorTotal} placeholder="calculado" /></td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
              <span className="ahint">Para incluir um item, preencha descrição, quantidade e valor unitário. O valor total é calculado. Quantidade com até 3 casas decimais; valores com 2.</span>
              <button className="btn dk" onClick={adicionar} disabled={novoErros.length > 0 || enviando}>Adicionar item</button>
            </div>
          </div>

          {falhaLLM && (
            <div className="msg-err mt">
              <b>A IA de extração não respondeu agora.</b>
              <div style={{ marginTop: 6 }}>Tente de novo ou continue sem ela: o nome de cada produto virá da descrição da nota e você confere tudo na próxima etapa.</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn dk" onClick={confirmar} disabled={enviando}>Tentar novamente</button>
                <button className="btn ghost" onClick={seguirSemLLM} disabled={enviando}>Continuar sem a LLM</button>
              </div>
            </div>
          )}
          <Erros lista={erros} />
        </div>

        <div className="popup-foot">
          <button className="btn cancel" onClick={() => setDraft(null)} disabled={enviando}>Cancelar</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span className="lab">{plural(t.qtdItens, 'item', 'itens')} · total <b className="serif" style={{ color: 'var(--ink)', fontSize: 'var(--fs-lg)' }}>{brl(t.valorTotal)}</b></span>
            <button className="btn dk big" onClick={confirmar} disabled={enviando}>{enviando ? 'Lendo os produtos…' : 'Confirmar nota'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Classificação por categoria (POST /api/produtos/classificar/), usada nas etapas Produtos e Categorias.
// Se o classificador não responder, a etapa Categorias abre com as categorias em branco para escolha manual.
function useClassificacao(setErros) {
  const { draft, setDraft, categorias, carregarCategorias } = useApp()
  const [enviando, setEnviando] = useState(false)
  const ocupado = useRef(false)

  const classificar = async () => {
    if (ocupado.current) return
    ocupado.current = true; setEnviando(true); setErros([])
    try {
      if (!categorias.length) {
        try { await carregarCategorias() } catch (err) { setErros(listaErros(err, 'Não foi possível carregar as categorias.')); return }
      }
      let resultado = null, falha = null
      try { resultado = await classificarProdutos(draft.produtos.map(paraClassificacao)) } catch (err) {
        if (err.response?.status === 400) { setErros(listaErros(err, 'Verifique os produtos.')); return }
        falha = err.response?.data?.detail || 'Classificador indisponível. Selecione as categorias manualmente.'
      }
      const porItem = new Map((resultado?.produtos || []).map(x => [x.n_item, x]))
      setDraft(d => ({
        ...d,
        stage: 'categorias',
        classificador: resultado ? { ok: true, resumo: resultado.resumo } : { ok: false, msg: falha },
        // A escolha manual do usuário é mantida; o restante recebe a sugestão do classificador.
        produtos: d.produtos.map(p => {
          const s = porItem.get(p.n_item) || null
          return { ...p, sugestao: s, categoria_id: p.categoriaManual ? p.categoria_id : s?.categoria_id ?? null }
        }),
      }))
    } finally { ocupado.current = false; setEnviando(false) }
  }
  return { classificar, enviando }
}

// ---------------------------------------------------------------------------
// Etapa 2: confirmar os produtos lidos pela LLM (alimentar ou não, nome e marca).
// ---------------------------------------------------------------------------
function Produtos() {
  const { draft, setDraft } = useApp()
  const [erros, setErros] = useState([])
  const { classificar, enviando } = useClassificacao(setErros)
  const { nota, produtos, semLLM } = draft
  const alimentares = produtos.filter(p => p.alimenticio).length
  const setP = (n, campo, valor) => setDraft(d => ({ ...d, produtos: d.produtos.map(p => p.n_item === n ? { ...p, [campo]: valor, editado: true } : p) }))
  const todos = v => setDraft(d => ({ ...d, produtos: d.produtos.map(p => ({ ...p, alimenticio: v })) }))
  const seguir = () => { const e = errosProdutos(produtos); setErros(e); if (!e.length) classificar() }

  return (
    <>
      <div className="ntc">
        <CabecalhoNota nota={nota} />
        <div className="scr" style={{ maxHeight: 560 }}>
          <table className="itab" style={{ minWidth: 980 }}>
            <thead><tr><th>Nº</th><th>Descrição na nota</th><th>Nome do produto</th><th>Marca</th><th className="r">Qtd</th><th className="r">Valor total</th><th style={{ textAlign: 'center' }}>Tipo</th></tr></thead>
            <tbody>
              {produtos.map(p => {
                const revisar = p.alimenticio && (!p.nome.trim() || (p.precisa_revisao && !p.editado))
                return (
                  <tr key={p.n_item} className={revisar ? 'bad' : undefined} title={revisar ? 'Confira o nome deste produto' : undefined}>
                    <td className="lab" style={{ width: 34 }}>{p.n_item}</td>
                    <td className="lab mono" style={{ fontSize: 'var(--fs-xs)', maxWidth: 220 }}>{p.descricao}</td>
                    <td>{p.alimenticio ? <input value={p.nome} maxLength={LIMITES.nome} placeholder="Nome do produto *" onChange={e => setP(p.n_item, 'nome', e.target.value)} disabled={enviando} /> : <span className="lab">—</span>}</td>
                    <td style={{ width: 170 }}>{p.alimenticio ? <input value={p.marca} maxLength={LIMITES.marca} placeholder="Sem marca" onChange={e => setP(p.n_item, 'marca', e.target.value)} disabled={enviando} /> : <span className="lab">—</span>}</td>
                    <td className="r lab" style={{ width: 70 }}>{fmtNum(toNum(p.un), 3)}</td>
                    <td className="r" style={{ width: 100 }}>{brl(toNum(p.valor_total))}</td>
                    <td style={{ width: 150, textAlign: 'center' }}>
                      <button className={'tag tipo ' + (p.alimenticio ? 'al' : 'na')} onClick={() => setP(p.n_item, 'alimenticio', !p.alimenticio)} disabled={enviando} title="Toque para alterar">{p.alimenticio ? 'Alimentar' : 'Não alimentar'}</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="tot"><span className="lab">Valor total da nota</span><b>{brl(totais(nota).valorTotal)}</b></div>
      </div>

      {semLLM && <div className="msg-err mt">A IA de extração não foi usada: os nomes vieram da descrição da nota. Confira o nome, a marca e o tipo de cada item.</div>}
      <div className="note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span><b>{alimentares} de {produtos.length}</b> itens são alimentares e seguirão para a classificação por categoria. Só eles são salvos. Toque na etiqueta para alterar.</span>
        <span style={{ display: 'flex', gap: 14 }}><span className="sc" onClick={() => !enviando && todos(true)}>Todos alimentares</span><span className="sc" onClick={() => !enviando && todos(false)}>Nenhum</span></span>
      </div>
      <Erros lista={erros} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
        {enviando && <span className="lab">Classificando {plural(alimentares, 'item', 'itens')}… pode levar alguns segundos.</span>}
        <button className="btn ghost" onClick={() => setDraft(d => ({ ...d, stage: 'nota' }))} disabled={enviando}>Voltar e editar a nota</button>
        <button className="btn cancel" onClick={() => setDraft(null)} disabled={enviando}>Descartar</button>
        <button className="btn dk big" onClick={seguir} disabled={enviando}>{enviando ? 'Classificando…' : 'Classificar categorias'}</button>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Etapa 3: confirmar a categoria de cada alimento e salvar a nota (POST /api/notas/confirmar/).
// ---------------------------------------------------------------------------
function Categorias() {
  const { draft, setDraft, categorias, toast, recarregar, setF } = useApp()
  const nav = useNavigate()
  const [erros, setErros] = useState([])
  const [salvando, setSalvando] = useState(false)
  const ocupado = useRef(false)
  const { classificar, enviando } = useClassificacao(setErros)
  const { nota, produtos, classificador } = draft
  const alimentos = produtos.filter(p => p.alimenticio)
  const outros = produtos.filter(p => !p.alimenticio)
  const totalAlimentos = sum(alimentos.map(p => toNum(p.valor_total)))
  const semCategoria = alimentos.filter(p => !p.categoria_id).length
  const ocupadoTela = salvando || enviando
  const ordenadas = [...categorias].sort((a, b) => a.categoria.localeCompare(b.categoria))

  const escolher = (n, id) => setDraft(d => ({ ...d, produtos: d.produtos.map(p => p.n_item === n ? { ...p, categoria_id: id ? Number(id) : null, categoriaManual: true } : p) }))

  const salvar = async () => {
    if (semCategoria) return setErros([`Escolha a categoria de ${plural(semCategoria, 'item', 'itens')}.`])
    if (ocupado.current) return
    ocupado.current = true; setSalvando(true); setErros([])
    try {
      const r = await confirmarNota(paraConfirmacao(nota, produtos))
      const total = sum(r.produtos.map(p => Number(p.valor_total)))
      toast(`Nota salva: ${plural(r.produtos.length, 'produto alimentício', 'produtos alimentícios')} · ${brl(total)}`)
      setDraft(null)
      recarregar()
      // Abre a nota recém-salva em Notas fiscais, no mês da compra.
      setF({ mode: 'month', anchor: r.nota.data_compra, all: false, cat: '', est: '', q: '', open: r.nota.chave_acesso })
      nav('/notas')
    } catch (err) {
      if (err.response?.status === 409) setErros([err.userMessage || 'Esta nota fiscal já foi cadastrada.', 'Volte à nota (Voltar aos produtos › Voltar e editar a nota) e troque a chave de acesso.'])
      else setErros(listaErros(err, 'Não foi possível salvar a nota.'))
    } finally { ocupado.current = false; setSalvando(false) }
  }

  const status = p => {
    const s = p.sugestao
    if (!p.categoria_id) return <span style={{ color: 'var(--red)' }}>{(s?.motivo && MOTIVOS[s.motivo]) || 'Escolha a categoria.'}</span>
    if (p.categoriaManual) return s?.categoria_id && s.categoria_id !== p.categoria_id ? `Alterado por você (sugestão: ${s.categoria})` : 'Escolhido por você'
    return s?.categoria_id === p.categoria_id ? 'Sugerido pelo classificador' : ''
  }

  return (
    <>
      {classificador?.ok === false ? (
        <div className="msg-err" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span><b>{classificador.msg}</b> Escolha a categoria de cada alimento abaixo.</span>
          <button className="btn ghost" onClick={classificar} disabled={ocupadoTela}>{enviando ? 'Classificando…' : 'Tentar classificar de novo'}</button>
        </div>
      ) : classificador?.resumo && (
        <div className="msg-ok">
          O classificador sugeriu a categoria de <b>{classificador.resumo.classificados} de {alimentos.length}</b> itens alimentícios
          {classificador.resumo.para_revisao ? <>; <b>{plural(classificador.resumo.para_revisao, 'item precisa', 'itens precisam')}</b> de revisão</> : ''}. Confira e ajuste se precisar.
        </div>
      )}

      <div className="ntc mt">
        <CabecalhoNota nota={nota} />
        <div className="scr" style={{ maxHeight: 560 }}>
          <table className="itab" style={{ minWidth: 860 }}>
            <thead><tr><th>Nº</th><th>Produto</th><th className="r">Valor total</th><th>Categoria</th><th /></tr></thead>
            <tbody>
              {alimentos.map(p => (
                <tr key={p.n_item} className={!p.categoria_id ? 'bad' : undefined}>
                  <td className="lab" style={{ width: 34 }}>{p.n_item}</td>
                  <td><b style={{ fontWeight: 500 }}>{p.nome}</b>{p.marca && <span className="lab"> · {p.marca}</span>}<div className="lab mono" style={{ fontSize: 'var(--fs-xs)', marginTop: 2 }}>{p.descricao}</div></td>
                  <td className="r" style={{ width: 110 }}>{brl(toNum(p.valor_total))}</td>
                  <td style={{ width: 260 }}>
                    <select className="f" value={p.categoria_id ?? ''} onChange={e => escolher(p.n_item, e.target.value)} disabled={ocupadoTela} style={{ width: '100%' }}>
                      <option value="">Selecione a categoria…</option>
                      {ordenadas.map(c => <option key={c.id} value={c.id}>{c.categoria}</option>)}
                    </select>
                  </td>
                  <td className="lab" style={{ fontSize: 'var(--fs-xs)', width: 220 }}>{status(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tot" style={{ flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="lab">Valor total da nota</span><span>{brl(totais(nota).valorTotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="lab">Gasto com alimentos (será salvo)</span><b>{brl(totalAlimentos)}</b></div>
        </div>
      </div>

      {!categorias.length && <div className="msg-err mt">Nenhuma categoria cadastrada no backend. Rode as migrations (manage.py migrate) para criar as 16 categorias.</div>}
      {outros.length > 0 && (
        <div className="note">
          <b>{plural(outros.length, 'item não alimentício não será salvo', 'itens não alimentícios não serão salvos')}</b> ({brl(sum(outros.map(p => toNum(p.valor_total))))}): {outros.map(p => p.descricao).join(' · ')}
        </div>
      )}
      <Erros lista={erros} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
        {semCategoria > 0 && <span className="lab">{plural(semCategoria, 'item sem categoria', 'itens sem categoria')}</span>}
        <button className="btn ghost" onClick={() => setDraft(d => ({ ...d, stage: 'produtos' }))} disabled={ocupadoTela}>Voltar aos produtos</button>
        <button className="btn cancel" onClick={() => setDraft(null)} disabled={ocupadoTela}>Descartar</button>
        <button className="btn dk big" onClick={salvar} disabled={ocupadoTela || semCategoria > 0}>{salvando ? 'Salvando…' : 'Salvar nota'}</button>
      </div>
    </>
  )
}
