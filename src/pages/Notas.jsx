import { Fragment } from 'react'
import PageHead from '../components/PageHead.jsx'
import TabRow from '../components/TabRow.jsx'
import FilterBar from '../components/FilterBar.jsx'
import SheetPreview from '../components/SheetPreview.jsx'
import StatusDados from '../components/StatusDados.jsx'
import { useApp } from '../store/AppContext.jsx'
import { brl, dmy, estName, sum } from '../lib/utils.js'

const qtd = v => String(v).replace('.', ',')

// Histórico de notas do usuário (GET /api/notas/ + GET /api/notas/<chave>/), busca, filtros e prévia da planilha.
// "Alimentos" é a soma dos produtos salvos; "Total do cupom" inclui os itens não alimentícios da nota.
export default function Notas() {
  const { S, F, setF, fin } = useApp()
  const r = fin.range(), q = F.q.toLowerCase()
  const base = S.notes
    .filter(n => (F.all || (n.date >= r[0] && n.date <= r[1])) && (!F.est || n.est === F.est) && (!F.cat || n.items.some(i => i.cat === F.cat)))
    .filter(n => !q || [estName(n.est), n.chave, n.pay, ...n.items.flatMap(i => [i.name, i.marca, i.cat])].join(' ').toLowerCase().includes(q))
    .sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
  const th = { background: 'none' }

  return (
    <>
      <PageHead eyebrow={'Notas fiscais · ' + (F.all ? 'TODO O HISTÓRICO' : fin.lab().toUpperCase())}>Nota por nota, item por item</PageHead>
      <TabRow tabs={[['nota', 'Por nota']]} active="nota" />
      <FilterBar chips />
      <StatusDados />
      <div className="card mt">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div><div className="mono lab">Histórico de notas</div><div className="lab" style={{ fontSize: 14, marginTop: 8 }}>Toque numa nota para ver os produtos salvos</div></div>
          <input style={{ maxWidth: 380, borderRadius: 20 }} placeholder="Buscar produto, marca, nota ou estabelecimento" value={F.q} onChange={e => setF({ q: e.target.value })} />
        </div>
        <div className="lab" style={{ fontSize: 14, margin: '10px 0 14px', textAlign: 'right' }}>
          Buscando em: {F.all ? <>todo o histórico · <span className="sc" onClick={() => setF({ all: false })}>voltar ao período</span></> : fin.lab()} · {F.cat || 'todas as categorias'} · {F.est ? estName(F.est) : 'todos os estabelecimentos'}
        </div>
        {base.length ? (<>
          <table>
            <thead><tr><th>Data da compra</th><th>Estabelecimento</th><th>Pagamento</th><th>Produtos</th><th className="r">Alimentos</th><th className="r">Total do cupom</th><th /></tr></thead>
            <tbody>
              {base.map(n => (
                <Fragment key={n.id}>
                  <tr className="hov" onClick={() => setF({ open: F.open === n.id ? null : n.id })} style={F.open === n.id ? { background: '#ece8d9' } : undefined}>
                    <td className="mono" style={{ fontSize: 14 }}>{dmy(n.date)}</td>
                    <td><b style={{ fontWeight: 500 }}>{estName(n.est)}</b></td>
                    <td>{n.pay || '—'}</td>
                    <td>{n.items.length || n.qtdProdutos} itens</td>
                    <td className="r serif" style={{ fontWeight: 600, fontSize: 17 }}>{brl(n.total)}</td>
                    <td className="r lab">{brl(n.totalCupom)}</td>
                    <td className="r lab">{F.open === n.id ? '▴' : '▾'}</td>
                  </tr>
                  {F.open === n.id && (
                    <tr style={{ background: '#ece8d9' }}><td colSpan={7} style={{ padding: '0 18px 18px' }}>
                      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: '6px 8px' }}>
                        <table>
                          <thead><tr><th style={th}>Produto</th><th style={th}>Marca</th><th style={th}>Categoria</th><th style={th}>Quantidade</th><th className="r" style={th}>Preço unitário</th><th className="r" style={th}>Total do item</th></tr></thead>
                          <tbody>{n.items.map(i => (
                            <tr key={i.id}>
                              <td style={{ border: 0 }}><b style={{ fontWeight: 500 }}>{i.name}</b></td>
                              <td style={{ border: 0 }} className="lab">{i.marca || '—'}</td>
                              <td style={{ border: 0 }}>{i.cat}</td>
                              <td style={{ border: 0 }}>{qtd(i.qty)}</td>
                              <td className="r" style={{ border: 0 }}>{brl(i.unitPrice)}</td>
                              <td className="r serif" style={{ border: 0, fontWeight: 600 }}>{brl(i.total)}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                        <div className="lab" style={{ padding: '8px 10px', fontSize: 12 }}>
                          Chave de acesso {n.chave}{n.cnpj ? ' · CNPJ ' + n.cnpj : ''}
                          {n.totalCupom - n.total > 0.005 && <> · {brl(n.totalCupom - n.total)} em itens não alimentícios (não salvos)</>}
                        </div>
                      </div>
                    </td></tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          <div className="lab" style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, gap: 12, flexWrap: 'wrap' }}>
            <span>{base.length} notas · {sum(base.map(n => n.items.length))} produtos · cupons {brl(sum(base.map(n => n.totalCupom)))}</span>
            <b className="serif" style={{ color: 'var(--ink)', fontSize: 17 }}>Alimentos {brl(sum(base.map(n => n.total)))}</b>
          </div>
        </>) : (
          <div className="empty">Nenhuma nota neste período.{!F.all && <><br /><span className="sc" onClick={() => setF({ all: true })}>Buscar em todo o histórico?</span></>}</div>
        )}
      </div>
      <div className="mt"><SheetPreview /></div>
    </>
  )
}
