import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useApp } from '../store/AppContext.jsx'
import { EST } from '../data/seed.js'
import { brl, estName, sum } from '../lib/utils.js'

// Aba "Detalhamento": tabela comparativa de menor preço por item entre estabelecimentos.
export default function Detalhamento() {
  const { F, fin } = useApp()
  const nav = useNavigate()
  const r = fin.range()

  // Último preço unitário pago por item e estabelecimento no período (ignora o filtro de estabelecimento).
  const map = {}
  fin.items(r, { est: '' }).forEach(i => {
    const k = `${i.name} (${i.unit})`, m = (map[k] = map[k] || {})
    if (!m[i.n.est] || m[i.n.est].d <= i.n.date) m[i.n.est] = { p: i.unitPrice, d: i.n.date }
  })
  const used = EST.filter(e => Object.values(map).some(m => m[e.id]))
  const rows = Object.entries(map).filter(([, m]) => Object.keys(m).length > 1).sort((a, b) => a[0].localeCompare(b[0]))
  const win = {}
  const lines = rows.map(([k, m]) => {
    const ks = Object.keys(m), lo = Math.min(...ks.map(x => m[x].p)), best = ks.find(x => m[x].p === lo)
    win[best] = (win[best] || 0) + 1
    return { k, m, lo, best, avg: sum(ks.map(x => m[x].p)) / ks.length }
  })
  const ws = Object.entries(win).sort((a, b) => b[1] - a[1])
  const zero = used.find(e => !win[e.id] && rows.some(([, m]) => m[e.id]))
  const msg = ws.length ? `${estName(ws[0][0])} tem o menor preço em ${ws[0][1]} dos ${rows.length} itens${ws[1] ? ' e ' + estName(ws[1][0]) + ' em ' + ws[1][1] : ''}.${zero ? ` ${zero.name} não foi o mais barato em nenhum item${F.cat ? ' de ' + F.cat.toLowerCase() : ''}.` : ''}` : ''
  const cn = new Set(fin.items(r).map(i => i.n.id)).size

  return (
    <>
      <div className="card mt" style={{ minWidth: 0 }}>
        <div className="ct">Tabela comparativa de menor preço{F.cat ? ' · ' + F.cat : ''}</div>
        <div className="cs" style={{ marginBottom: 20 }}>A cor verde representa o menor preço entre todos os estabelecimentos</div>
        {lines.length ? (<>
          <div className="scr" style={{ maxHeight: 560, border: '1px solid var(--line)', borderRadius: 14 }}>
            <table style={{ minWidth: 300 + used.length * 150 }}>
              <thead><tr>
                <th className="stl">Item</th>
                {used.map(e => <th key={e.id} className="r">{e.name}</th>)}
                <th className="str" style={{ background: '#ece8d9' }}>Melhor preço</th>
              </tr></thead>
              <tbody>{lines.map(({ k, m, lo, best, avg }) => (
                <tr key={k}>
                  <td className="stl"><b style={{ fontWeight: 500 }}>{k}</b></td>
                  {used.map(e => <td key={e.id} className="r">{m[e.id] ? (m[e.id].p === lo ? <span className="good">{brl(lo)}</span> : brl(m[e.id].p)) : <span className="lab">—</span>}</td>)}
                  <td className="str"><b style={{ color: 'var(--dg)' }}>{estName(best)}</b><div className="lab" style={{ fontSize: 12 }}>{brl(avg - lo)} abaixo da média</div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {msg && <div className="note">{msg}</div>}
        </>) : <div className="empty">Nenhum item comprado em mais de um estabelecimento neste período.</div>}
      </div>

      <div className="card mt" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 30px' }}>
        <span style={{ color: 'var(--dg)' }}><Icon n="rcpt" s={24} /></span>
        <div style={{ flex: 1, fontSize: 15 }}>{cn} notas fiscais deste período têm itens{F.cat ? ' de ' + F.cat.toLowerCase() : ''}. Veja cada nota e os itens comprados.</div>
        <span className="sc" style={{ color: 'var(--dg)', fontWeight: 500 }} onClick={() => nav('/notas')}>Ver em Notas fiscais</span>
      </div>
    </>
  )
}
