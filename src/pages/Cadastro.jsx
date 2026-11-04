import { useEffect, useRef, useState } from 'react'
import PageHead from '../components/PageHead.jsx'
import { useApp } from '../store/AppContext.jsx'
import notaTesteXml from '../data/nota-teste.xml?raw'
import { UNIDADES, editarItem, errosItem, fmtNum, parseNfceXml, toNum, totais, validarNota } from '../lib/nfce.js'
import { brl, dmy } from '../lib/utils.js'

// Fluxo do Cadastro (draft.stage): sem rascunho = leitura · 'editar' = pop-up de confirmação sobre a tela · 'classificar' = alimentar ou não.
export default function Cadastro() {
  const { draft, setDraft, toast } = useApp()

  // Leitura de demonstração: carrega a nota fictícia "crua" (src/data/nota-teste.xml).
  // No produto real, é aqui que entra a consulta da NFC-e a partir do QR Code lido.
  const lerNota = () => {
    try { setDraft({ stage: 'editar', nota: parseNfceXml(notaTesteXml) }) } // o pop-up de confirmação abre em seguida
    catch (e) { toast(e.message) }
  }

  return (
    <>
      <PageHead eyebrow="Cadastro · Nota fiscal">Escaneie o QR code da sua nota fiscal</PageHead>
      <div className="row mt">
        <div style={{ width: 425, flex: 'none' }}>
          <Camera ativa={!draft} onLeitura={lerNota} />
          <button className="btn dk" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={lerNota} disabled={!!draft}>Simular leitura da nota</button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {draft?.stage === 'classificar' ? <Classificacao /> : (
            <div className="empty">Nenhuma nota lida ainda.<br />Aponte o QR Code da nota fiscal para a webcam.<br /><span className="mono" style={{ fontSize: 12 }}>Uma nota por vez</span></div>
          )}
        </div>
      </div>
      {draft?.stage === 'editar' && <Confirmacao />}
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

// Etapa 1: pop-up de confirmação sobre a tela de Cadastro (fundo translúcido).
// Mostra só os dados do estabelecimento (com número, data, protocolo e chave da nota) e os itens, todos editáveis.
function Confirmacao() {
  const { draft, setDraft, toast } = useApp()
  const [erros, setErros] = useState([])
  const novoVazio = { descricao: '', quantidade: '1', unidade: 'UN', valorUnitario: '', valorTotal: '', alimenticio: true }
  const [novo, setNovo] = useState(novoVazio)
  const corpo = useRef(null)
  const nota = draft.nota
  const t = totais(nota)

  // Enquanto o pop-up está aberto, a página de fundo não rola
  useEffect(() => { const o = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = o } }, [])

  const set = (grupo, campo, valor) => setDraft(d => ({ ...d, nota: grupo ? { ...d.nota, [grupo]: { ...d.nota[grupo], [campo]: valor } } : { ...d.nota, [campo]: valor } }))
  const setItem = (k, campo, valor) => setDraft(d => ({ ...d, nota: { ...d.nota, itens: d.nota.itens.map((i, j) => j === k ? editarItem(i, campo, valor) : i) } }))
  const remover = k => setDraft(d => ({ ...d, nota: { ...d.nota, itens: d.nota.itens.filter((_, j) => j !== k) } }))
  const novoCalc = editarItem(novo, 'quantidade', novo.quantidade)
  const novoErros = errosItem(novoCalc)
  const adicionar = () => {
    if (novoErros.length) return toast('Preencha ' + novoErros.join(', ') + ' do novo item.')
    setDraft(d => ({ ...d, nota: { ...d.nota, itens: [...d.nota.itens, { ...novoCalc, key: 'n' + Date.now() }] } }))
    setNovo(novoVazio)
  }
  const confirmar = () => {
    const e = validarNota(nota)
    setErros(e)
    if (e.length) { corpo.current?.scrollTo({ top: corpo.current.scrollHeight, behavior: 'smooth' }); return }
    setDraft(d => ({ ...d, stage: 'classificar' }))
  }
  const inp = (grupo, campo, props = {}) => <input value={grupo ? nota[grupo][campo] : nota[campo]} onChange={e => set(grupo, campo, e.target.value)} {...props} />

  return (
    <div className="popup" role="dialog" aria-modal="true" aria-labelledby="pop-tit">
      <div className="popup-box">
        <div className="popup-head">
          <div className="eyebrow mono">Cadastro · Confirmação da nota</div>
          <h2 id="pop-tit">Confira a leitura da nota fiscal</h2>
          <p className="lab">Confira os dados do estabelecimento e todos os itens lidos. Qualquer campo pode ser corrigido.</p>
        </div>

        <div className="popup-body" ref={corpo}>
          <div className="card">
            <div className="ct-sm">Estabelecimento</div>
            <div className="grid4">
              <Campo label="Razão social" span={2}>{inp('emitente', 'razaoSocial')}</Campo>
              <Campo label="CNPJ">{inp('emitente', 'cnpj', { inputMode: 'numeric' })}</Campo>
              <Campo label="Número da nota">{inp('info', 'numero', { inputMode: 'numeric' })}</Campo>
              <Campo label="Endereço" span={2}>{inp('emitente', 'endereco')}</Campo>
              <Campo label="Data de emissão">{inp('info', 'dataEmissao', { type: 'date' })}</Campo>
              <Campo label="Protocolo de autorização">{inp('info', 'protocolo', { inputMode: 'numeric' })}</Campo>
              <Campo label="Chave de acesso (44 dígitos)" span={4}>{inp(null, 'chave', { inputMode: 'numeric' })}</Campo>
            </div>
          </div>

          <div className="card mt">
            <div className="ct-sm">Itens da nota <span className="lab" style={{ fontSize: 'var(--fs-sm)', fontWeight: 400 }}>{nota.itens.length} itens, na ordem do documento</span></div>
            <div className="scr">
              <table className="itab">
                <thead><tr><th>Nº</th><th>Descrição</th><th className="r">Qtd</th><th>Un</th><th className="r">Valor unit. (R$)</th><th className="r">Valor total (R$)</th><th /></tr></thead>
                <tbody>
                  {nota.itens.map((i, k) => {
                    const bad = errosItem(i)
                    return (
                      <tr key={i.key} className={bad.length ? 'bad' : undefined} title={bad.length ? 'Verifique: ' + bad.join(', ') : undefined}>
                        <td className="lab" style={{ width: 34 }}>{k + 1}</td>
                        <td><input value={i.descricao} onChange={e => setItem(k, 'descricao', e.target.value)} /></td>
                        <td style={{ width: 92 }}><input className="r" inputMode="decimal" value={i.quantidade} onChange={e => setItem(k, 'quantidade', e.target.value)} /></td>
                        <td style={{ width: 84 }}><select className="f" value={i.unidade} onChange={e => setItem(k, 'unidade', e.target.value)}>{UNIDADES.map(u => <option key={u}>{u}</option>)}</select></td>
                        <td style={{ width: 128 }}><input className="r" inputMode="decimal" value={i.valorUnitario} onChange={e => setItem(k, 'valorUnitario', e.target.value)} /></td>
                        <td style={{ width: 128 }}><input className="r" inputMode="decimal" value={i.valorTotal} onChange={e => setItem(k, 'valorTotal', e.target.value)} /></td>
                        <td style={{ width: 40 }}><button className="x" title="Excluir item" onClick={() => remover(k)}>×</button></td>
                      </tr>
                    )
                  })}
                  <tr className="addrow">
                    <td className="lab">+</td>
                    <td><input placeholder="Nome do item *" value={novo.descricao} onChange={e => setNovo({ ...novo, descricao: e.target.value })} onKeyDown={e => e.key === 'Enter' && adicionar()} /></td>
                    <td><input className="r" inputMode="decimal" placeholder="Qtd *" value={novo.quantidade} onChange={e => setNovo({ ...novo, quantidade: e.target.value })} /></td>
                    <td><select className="f" value={novo.unidade} onChange={e => setNovo({ ...novo, unidade: e.target.value })}>{UNIDADES.map(u => <option key={u}>{u}</option>)}</select></td>
                    <td><input className="r" inputMode="decimal" placeholder="0,00 *" value={novo.valorUnitario} onChange={e => setNovo({ ...novo, valorUnitario: e.target.value })} onKeyDown={e => e.key === 'Enter' && adicionar()} /></td>
                    <td><input className="r calc" readOnly tabIndex={-1} value={novoCalc.valorTotal} placeholder="calculado" /></td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
              <span className="ahint">Para incluir um item, preencha nome, quantidade, unidade e valor unitário. Marca e peso no nome são opcionais. O valor total é calculado.</span>
              <button className="btn dk" onClick={adicionar} disabled={novoErros.length > 0}>Adicionar item</button>
            </div>
          </div>

          {erros.length > 0 && <div className="msg-err mt"><b>Corrija antes de continuar:</b><ul style={{ margin: '8px 0 0 18px' }}>{erros.map(e => <li key={e}>{e}</li>)}</ul></div>}
        </div>

        <div className="popup-foot">
          <button className="btn cancel" onClick={() => setDraft(null)}>Cancelar</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span className="lab">{t.qtdItens} itens · total <b className="serif" style={{ color: 'var(--ink)', fontSize: 'var(--fs-lg)' }}>{brl(t.valorTotal)}</b></span>
            <button className="btn dk big" onClick={confirmar}>Confirmar nota</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Etapa 2: itens com as colunas nomeadas e a marcação ALIMENTAR (verde) ou NÃO ALIMENTAR (vermelho).
// Só os itens alimentares seguem para a categorização (LLM).
function Classificacao() {
  const { draft, setDraft, confirmNote } = useApp()
  const nota = draft.nota
  const t = totais(nota)
  const alimentares = nota.itens.filter(i => i.alimenticio).length
  const alternar = k => setDraft(d => ({ ...d, nota: { ...d.nota, itens: d.nota.itens.map((i, j) => j === k ? { ...i, alimenticio: !i.alimenticio } : i) } }))
  const todos = v => setDraft(d => ({ ...d, nota: { ...d.nota, itens: d.nota.itens.map(i => ({ ...i, alimenticio: v })) } }))
  return (
    <>
      <div className="ntc">
        <header>
          <div><b style={{ fontSize: 'var(--fs-md)' }}>{nota.emitente.razaoSocial}</b><div className="lab" style={{ fontSize: 'var(--fs-xs)', marginTop: 4 }}>CNPJ {nota.emitente.cnpj}</div></div>
          <div className="lab" style={{ textAlign: 'right' }}>{dmy(nota.info.dataEmissao)}<div style={{ fontSize: 'var(--fs-xs)', marginTop: 4 }}>NFC-e nº {nota.info.numero} · série {nota.info.serie}</div></div>
        </header>
        <div className="it2 head mono lab"><span>Item</span><span className="r">Qtd</span><span>Un</span><span className="r">Valor unit.</span><span className="r">Valor total</span><span style={{ textAlign: 'center' }}>Tipo</span></div>
        <div className="scr" style={{ maxHeight: 520 }}>
          {nota.itens.map((i, k) => (
            <div className="it2" key={i.key}>
              <span>{i.descricao}</span>
              <span className="r lab">{fmtNum(toNum(i.quantidade), 3)}</span>
              <span className="lab">{i.unidade}</span>
              <span className="r">{brl(toNum(i.valorUnitario))}</span>
              <span className="r">{brl(toNum(i.valorTotal))}</span>
              <button className={'tag tipo ' + (i.alimenticio ? 'al' : 'na')} onClick={() => alternar(k)} title="Toque para alterar">{i.alimenticio ? 'Alimentar' : 'Não alimentar'}</button>
            </div>
          ))}
        </div>
        <div className="tot" style={{ flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="lab">Valor total</span><span>{brl(t.valorTotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="lab">Descontos</span><span>{brl(t.descontos)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="lab">Valor a pagar · {nota.pagamento.forma}</span><b>{brl(t.valorAPagar)}</b></div>
        </div>
      </div>
      <div className="note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span><b>{alimentares} de {nota.itens.length}</b> itens são alimentares e seguirão para a categorização. Toque na etiqueta para alterar.</span>
        <span style={{ display: 'flex', gap: 14 }}><span className="sc" onClick={() => todos(true)}>Todos alimentares</span><span className="sc" onClick={() => todos(false)}>Nenhum</span></span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
        <button className="btn ghost" onClick={() => setDraft(d => ({ ...d, stage: 'editar' }))}>Voltar e editar</button>
        <button className="btn cancel" onClick={() => setDraft(null)}>Descartar</button>
        <button className="btn dk big" onClick={() => confirmNote(nota)}>Confirmar itens</button>
      </div>
    </>
  )
}
