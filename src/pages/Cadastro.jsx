import { useEffect, useRef, useState } from 'react'
import PageHead from '../components/PageHead.jsx'
import { useApp } from '../store/AppContext.jsx'
import { EST, SAMPLES } from '../data/seed.js'
import { classify } from '../lib/finance.js'
import { brl, dmy, sum, today } from '../lib/utils.js'

const STORAGE = ['geladeira', 'despensa', 'freezer']

// Cartão com a nota em edição (uma por vez).
function NoteCard({ draft, setDraft, canEmpty }) {
  const e = EST.find(x => x.id === draft.est)
  const upd = items => setDraft(items.length || canEmpty ? { ...draft, items } : null)
  return (
    <div className="ntc">
      <header><div><b style={{ fontSize: 17 }}>{e.name}</b><div className="lab" style={{ fontSize: 12, marginTop: 4 }}>CNPJ {e.cnpj}</div></div><span className="lab">{dmy(draft.date)}</span></header>
      {draft.items.map((i, k) => (
        <div className="it" key={k}>
          <span>{i.name}</span><span className="lab r">{i.qty} {i.unit}</span><span className="r">{brl(i.total)}</span>
          <span className={'tag ' + i.storage} onClick={() => upd(draft.items.map((x, j) => j === k ? { ...x, storage: STORAGE[(STORAGE.indexOf(x.storage) + 1) % 3] } : x))}>{i.storage}</span>
          <button className="x" onClick={() => upd(draft.items.filter((_, j) => j !== k))}>×</button>
        </div>
      ))}
      <div className="tot"><span className="lab">Total da nota</span><b>{brl(sum(draft.items.map(i => i.total)))}</b></div>
    </div>
  )
}

export default function Cadastro() {
  const { S, draft, setDraft, cadTab, setCadTab, toast, confirmNote } = useApp()
  const [camOn, setCamOn] = useState(false)
  const [chave, setChave] = useState('')
  const [m, setM] = useState({ est: 'pao', dt: today(), nm: '', q: 1, u: 'un', v: '' })
  const vid = useRef(null)

  // Leitura de demonstração: devolve a próxima nota de exemplo ainda não usada.
  // No produto real, é aqui que entra a consulta da NFC-e pelo QR Code ou pela chave de acesso.
  const readNote = () => {
    const u = SAMPLES.findIndex((_, i) => !S.used.includes(i))
    if (u < 0) { toast('Todas as notas de demonstração já foram lidas. Restaure os dados em Configurações.'); return }
    const s = SAMPLES[u]
    setDraft({ sample: u, est: s.est, nf: s.nf, date: s.date, items: s.items.map(i => ({ name: i[0], qty: i[1], unit: i[2], total: i[3], unitPrice: Math.round(i[3] / i[1] * 100) / 100, cat: i[4], storage: i[5] })) })
    toast('Nota lida: ' + s.items.length + ' itens')
  }
  const live = useRef(); live.current = { readNote, draft }

  // Webcam: abre ao entrar na aba e fecha ao sair; detecta QR Code quando o navegador suporta.
  useEffect(() => {
    if (cadTab !== 'webcam' || !navigator.mediaDevices?.getUserMedia) return
    let stream, stop = false, timer
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(st => {
      if (stop) { st.getTracks().forEach(t => t.stop()); return }
      stream = st; setCamOn(true)
      if (vid.current) vid.current.srcObject = st
      if ('BarcodeDetector' in window) {
        const bd = new window.BarcodeDetector({ formats: ['qr_code'] })
        const tick = async () => {
          if (stop) return
          try { const c = await bd.detect(vid.current); if (c.length && !live.current.draft) { live.current.readNote(); return } } catch { /* ignora */ }
          timer = setTimeout(tick, 600)
        }
        tick()
      }
    }).catch(() => {})
    return () => { stop = true; clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()); setCamOn(false) }
  }, [cadTab])

  const buscarChave = () => chave.replace(/\D/g, '').length === 44 ? readNote() : toast('A chave de acesso tem 44 dígitos.')
  const addManual = () => {
    const q = +m.q, v = +m.v, nm = m.nm.trim()
    if (!nm || !q || !v) return toast('Preencha item, quantidade e valor.')
    const [cat, storage] = classify(nm)
    const item = { name: nm, qty: q, unit: m.u, total: v, unitPrice: Math.round(v / q * 100) / 100, cat, storage }
    setDraft(d => ({ nf: '', ...(d || {}), est: m.est, date: m.dt, items: [...(d?.items || []), item] }))
    setM({ ...m, nm: '' })
  }
  const F = (label, el) => <div className="fld"><label className="lab mono">{label}</label>{el}</div>

  return (
    <>
      <PageHead eyebrow="Cadastro · Nota fiscal">Escaneie a nota ou digite manualmente</PageHead>
      <div className="fbar">
        {[['webcam', 'Webcam'], ['barra', 'Código de barras'], ['manual', 'Manual']].map(([k, t]) => <span key={k} className={'seg' + (cadTab === k ? ' on' : '')} onClick={() => setCadTab(k)}>{t}</span>)}
      </div>
      <div className="row mt">
        <div style={{ width: 425, flex: 'none' }}>
          {cadTab === 'webcam' && (<>
            <div className="cam">
              <div className="lb mono"><i />Webcam {camOn ? 'ativa' : 'inativa'}</div>
              <video ref={vid} autoPlay muted playsInline />
              <div className="fr" /><div className="hint">Aponte o QR Code da nota fiscal para a webcam</div>
            </div>
            <button className="btn dk" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={readNote}>Simular leitura da nota</button>
          </>)}
          {cadTab === 'barra' && (
            <div className="card">
              {F('Chave de acesso (44 dígitos)', <input value={chave} onChange={e => setChave(e.target.value)} inputMode="numeric" maxLength={54} placeholder="0000 0000 0000 …" />)}
              <button className="btn dk" style={{ marginTop: 18 }} onClick={buscarChave}>Buscar nota</button>
            </div>
          )}
          {cadTab === 'manual' && (
            <div className="card">
              {F('Estabelecimento', <select className="f" value={m.est} onChange={e => setM({ ...m, est: e.target.value })}>{EST.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>)}
              <div style={{ marginTop: 14 }}>{F('Data da nota', <input type="date" value={m.dt} onChange={e => setM({ ...m, dt: e.target.value })} />)}</div>
              <hr style={{ margin: '20px 0', border: 0, borderTop: '1px solid var(--line)' }} />
              {F('Item', <input value={m.nm} onChange={e => setM({ ...m, nm: e.target.value })} placeholder="Ex.: Leite integral" />)}
              <div className="grid2" style={{ marginTop: 14 }}>
                {F('Quantidade', <input type="number" step="0.1" value={m.q} onChange={e => setM({ ...m, q: e.target.value })} />)}
                {F('Unidade', <select className="f" value={m.u} onChange={e => setM({ ...m, u: e.target.value })}>{['un', 'kg', 'g', 'L', 'ml'].map(u => <option key={u}>{u}</option>)}</select>)}
              </div>
              <div style={{ marginTop: 14 }}>{F('Valor total (R$)', <input type="number" step="0.01" value={m.v} onChange={e => setM({ ...m, v: e.target.value })} placeholder="0,00" />)}</div>
              <button className="btn dk" style={{ marginTop: 18 }} onClick={addManual}>Adicionar item</button>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {draft ? (<>
            <NoteCard draft={draft} setDraft={setDraft} canEmpty={cadTab === 'manual'} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
              <button className="btn" style={{ background: 'transparent', color: 'var(--mute)', border: '1px solid #bfc4ae' }} onClick={() => setDraft(null)}>Descartar</button>
              <button className="btn dk big" disabled={!draft.items.length} onClick={confirmNote}>Confirmar itens</button>
            </div>
          </>) : (
            <div className="empty">Nenhuma nota lida ainda.<br />Leia o QR Code, informe a chave de acesso ou digite os itens.<br /><span className="mono" style={{ fontSize: 11 }}>Uma nota por vez</span></div>
          )}
        </div>
      </div>
    </>
  )
}
