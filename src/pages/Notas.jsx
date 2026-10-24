import { Fragment } from 'react'
import PageHead from '../components/PageHead.jsx'
import TabRow from '../components/TabRow.jsx'
import FilterBar from '../components/FilterBar.jsx'
import SheetPreview from '../components/SheetPreview.jsx'
import { useApp } from '../store/AppContext.jsx'
import { brl, dmy, estName, sum } from '../lib/utils.js'

// Histórico de notas (sem coluna de categoria), busca, filtros e prévia da planilha.
export default function Notas() {
  const { S, removeNote, F, setF, fin } = useApp()
  const r = fin.range(), q = F.q.toLowerCase()
  const base = S.notes
    .filter(n => (F.all || (n.date >= r[0] && n.date <= r[1])) && (!F.est || n.est === F.est) && (!F.cat || n.items.some(i => i.cat === F.cat)))
    .filter(n => !q || [estName(n.est), n.nf, ...n.items.map(i => i.name)].join(' ').toLowerCase().includes(q))
    .sort((a, b) => a.date < b.date ? 1 : -1)
  const excluir = id => { if (window.confirm('Excluir esta nota?')) { removeNote(id); setF({ open: null }) } }
  const th = { background: 'none' }

  return (
    <>
      <PageHead eyebrow={'Notas fiscais · ' + fin.lab().toUpperCase()}>Nota por nota, item por item</PageHead>
      <TabRow tabs={[['nota', 'Por nota']]} active="nota" />
      <FilterBar chips />
      <div className="card mt">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div><div className="mono lab">Histórico de notas</div><div className="lab" style={{ fontSize: 14, marginTop: 8 }}>Toque numa nota para ver os itens comprados</div></div>
          <input style={{ maxWidth: 380, borderRadius: 20 }} placeholder="Buscar item, nota ou estabelecimento" value={F.q} onChange={e => setF({ q: e.target.value })} />
        </div>
        <div className="lab" style={{ fontSize: 14, margin: '10px 0 14px', textAlign: 'right' }}>
          Buscando em: {F.all ? 'todo o histórico' : fin.lab()} · {F.cat || 'todas as categorias'} · {F.est ? estName(F.est) : 'todos os estabelecimentos'}
        </div>
        {base.length ? (<>
          <table>
            <thead><tr><th>Data da nota</th><th>Nº da nota</th><th>Estabelecimento</th><th>Pagamento</th><th>Itens</th><th className="r">Total da nota</th><th /></tr></thead>
            <tbody>
              {base.map(n => (
                <Fragment key={n.id}>
                  <tr className="hov" onClick={() => setF({ open: F.open === n.id ? null : n.id })} style={F.open === n.id ? { background: '#ece8d9' } : undefined}>
                    <td className="mono" style={{ fontSize: 14 }}>{dmy(n.date)}</td>
                    <td className="mono lab" style={{ fontSize: 14 }}>{n.nf || '—'}</td>
                    <td><b style={{ fontWeight: 500 }}>{estName(n.est)}</b></td>
                    <td>{n.pay || '—'}</td>
                    <td>{n.items.length} itens</td>
                    <td className="r serif" style={{ fontWeight: 600, fontSize: 17 }}>{brl(n.total)}</td>
                    <td className="r lab">{F.open === n.id ? '▴' : '▾'}</td>
                  </tr>
                  {F.open === n.id && (
                    <tr style={{ background: '#ece8d9' }}><td colSpan={7} style={{ padding: '0 18px 18px' }}>
                      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: '6px 8px' }}>
                        <table>
                          <thead><tr><th style={th}>Item</th><th style={th}>Quantidade</th><th className="r" style={th}>Preço unitário</th><th className="r" style={th}>Total do item</th></tr></thead>
                          <tbody>{n.items.map((i, k) => (
                            <tr key={k}><td style={{ border: 0 }}><b style={{ fontWeight: 500 }}>{i.name}</b></td><td style={{ border: 0 }}>{i.qty} {i.unit}</td>
                              <td className="r" style={{ border: 0 }}>{brl(i.unitPrice)}</td><td className="r serif" style={{ border: 0, fontWeight: 600 }}>{brl(i.total)}</td></tr>
                          ))}</tbody>
                        </table>
                        {n.chave && <div className="lab" style={{ padding: '8px 10px', fontSize: 12 }}>Código {n.codigo} · Chave de acesso (fictícia) {n.chave}</div>}
                        <div style={{ padding: '8px 10px' }}><span className="sc" style={{ color: 'var(--red)' }} onClick={e => { e.stopPropagation(); excluir(n.id) }}>Excluir nota</span></div>
                      </div>
                    </td></tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          <div className="lab" style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16 }}>
            <span>{base.length} notas · {sum(base.map(n => n.items.length))} itens</span>
            <b className="serif" style={{ color: 'var(--ink)', fontSize: 17 }}>Total {brl(sum(base.map(n => n.total)))}</b>
          </div>
        </>) : (
          <div className="empty">Nenhum resultado neste período.{!F.all && <><br /><span className="sc" onClick={() => setF({ all: true })}>Buscar em todo o histórico?</span></>}</div>
        )}
      </div>
      <div className="mt"><SheetPreview /></div>
    </>
  )
}
