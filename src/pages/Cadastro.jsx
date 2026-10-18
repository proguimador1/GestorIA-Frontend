import { useEffect, useRef, useState } from 'react'
import PageHead from '../components/PageHead.jsx'
import { useApp } from '../store/AppContext.jsx'
import { EST, SAMPLES } from '../data/seed.js'
import { brl, dmy, sum } from '../lib/utils.js'

const STORAGE = ['geladeira', 'despensa', 'freezer']

// Cartão com a nota lida (uma por vez).
function NoteCard({ draft, setDraft }) {
  const e = EST.find(x => x.id === draft.est)
  const upd = items => setDraft(items.length ? { ...draft, items } : null)
  return (
    <div className="ntc">
      <header><div><b style={{ fontSize: 17 }}>{e.name}</b><div className="lab" style={{ fontSize: 14, marginTop: 4 }}>CNPJ {e.cnpj}</div></div><span className="lab">{dmy(draft.date)}</span></header>
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
  const { S, draft, setDraft, toast, confirmNote } = useApp()
  const [camOn, setCamOn] = useState(false)
  const vid = useRef(null)

  // Leitura de demonstração: devolve a próxima nota de exemplo ainda não usada.
  // No produto real, é aqui que entra a consulta da NFC-e a partir do QR Code lido.
  const readNote = () => {
    const u = SAMPLES.findIndex((_, i) => !S.used.includes(i))
    if (u < 0) { toast('Todas as notas de demonstração já foram lidas. Restaure os dados em Configurações.'); return }
    const s = SAMPLES[u]
    setDraft({ sample: u, est: s.est, nf: s.nf, date: s.date, items: s.items.map(i => ({ name: i[0], qty: i[1], unit: i[2], total: i[3], unitPrice: Math.round(i[3] / i[1] * 100) / 100, cat: i[4], storage: i[5] })) })
    toast('Nota lida: ' + s.items.length + ' itens')
  }
  const live = useRef(); live.current = { readNote, draft }

  // Webcam: abre ao entrar na tela e fecha ao sair; detecta QR Code quando o navegador suporta.
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
          try { const c = await bd.detect(vid.current); if (c.length && !live.current.draft) { live.current.readNote(); return } } catch { /* ignora */ }
          timer = setTimeout(tick, 600)
        }
        tick()
      }
    }).catch(() => {})
    return () => { stop = true; clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()); setCamOn(false) }
  }, [])

  return (
    <>
      <PageHead eyebrow="Cadastro · Nota fiscal">Escaneie o QR code da sua nota fiscal</PageHead>
      <div className="row mt">
        <div style={{ width: 425, flex: 'none' }}>
          <div className="cam">
            <div className="lb mono"><i />Webcam {camOn ? 'ativa' : 'inativa'}</div>
            <video ref={vid} autoPlay muted playsInline />
            <div className="fr" /><div className="hint">Aponte o QR Code da nota fiscal para a webcam</div>
          </div>
          <button className="btn dk" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={readNote}>Simular leitura da nota</button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {draft ? (<>
            <NoteCard draft={draft} setDraft={setDraft} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
              <button className="btn" style={{ background: 'transparent', color: 'var(--mute)', border: '1px solid #bfc4ae' }} onClick={() => setDraft(null)}>Descartar</button>
              <button className="btn dk big" disabled={!draft.items.length} onClick={confirmNote}>Confirmar itens</button>
            </div>
          </>) : (
            <div className="empty">Nenhuma nota lida ainda.<br />Aponte o QR Code da nota fiscal para a webcam.<br /><span className="mono" style={{ fontSize: 12 }}>Uma nota por vez</span></div>
          )}
        </div>
      </div>
    </>
  )
}
