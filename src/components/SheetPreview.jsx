import { useState } from 'react'
import Icon from './Icon.jsx'
import { useApp } from '../store/AppContext.jsx'
import { ABAS, exportSheet, linhasExtremos } from '../lib/export.js'
import { brl, sum } from '../lib/utils.js'

// Prévia da planilha antes de baixar: duas abas ("Detalhada" e "Simples"), cada uma com o total no rodapé.
export default function SheetPreview() {
  const { F, fin, toast } = useApp()
  const [aba, setAba] = useState('Detalhada')
  const dados = { Detalhada: fin.sheetRows(), Simples: fin.sheetSimple() }
  const { head, moeda, total } = ABAS[aba]
  const rows = dados[aba]
  const ne = new Set(dados.Detalhada.map(r => r[1])).size
  const baixar = async () => { await exportSheet(dados, F.mode, fin.range()); toast('Planilha gerada') }
  // Linhas Máximo e Mínimo do rodapé (as mesmas da planilha baixada), com o estabelecimento e o item de cada valor.
  const extremos = linhasExtremos(ABAS[aba], rows)
  const extremo = x => {
    const cor = x.tipo === 'max' ? 'var(--red)' : 'var(--g)', st = { padding: '8px 12px', fontWeight: 600, color: cor }
    return (
      <tr key={x.tipo + x.col}>{head.map((_, c) => c === 0 ? <td key={c} style={{ ...st, whiteSpace: 'nowrap' }}>{x.nome}</td>
        : c === x.col ? <td key={c} style={{ ...st, textAlign: 'right' }}>{brl(x.valor)}</td>
          : c in x.rotulos ? <td key={c} style={{ ...st, fontWeight: 500, fontSize: 14 }}>{x.rotulos[c]}</td> : <td key={c} />)}</tr>
    )
  }
  const alinhar = c => moeda.includes(c) || typeof rows[0]?.[c] === 'number' ? 'right' : 'left'
  return (
    <div className="card" id="prev">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="mono lab">Prévia da planilha</div>
          <div className="lab" style={{ marginTop: 8, fontSize: 14 }}>{dados.Detalhada.length} itens · {dados.Simples.length} compras · {ne} estabelecimentos · {fin.lab()}</div>
        </div>
        <button className="btn dk" onClick={baixar} disabled={!dados.Detalhada.length}><Icon n="dl" s={17} />Baixar planilha (.xlsx)</button>
      </div>
      <div className="scr" style={{ marginTop: 20, borderRadius: '12px 12px 0 0' }}>
        <table className="sheet" style={{ minWidth: aba === 'Detalhada' ? 900 : 640, borderCollapse: 'collapse' }}>
          <tbody>
            <tr>{head.map(h => <th key={h} style={{ padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
            {rows.slice(0, 5).map((r, i) => (
              <tr key={i}>{r.map((v, k) => <td key={k} style={{ padding: '8px 12px', fontSize: 14, textAlign: alinhar(k) }}>{moeda.includes(k) ? brl(v) : String(v).replace('.', ',')}</td>)}</tr>
            ))}
            {!rows.length && <tr><td colSpan={head.length} className="lab" style={{ padding: 16 }}>Nenhum item neste período.</td></tr>}
            {rows.length > 5 && <tr><td colSpan={head.length} className="lab" style={{ padding: '8px 12px' }}>… e mais {rows.length - 5} linhas</td></tr>}
            <tr><td colSpan={total} style={{ padding: '8px 12px', fontWeight: 600 }}>Total</td><td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{brl(sum(rows.map(r => r[total])))}</td>{head.slice(total + 1).map((_, k) => <td key={k} />)}</tr>
            {extremos.map(extremo)}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', background: '#e6e2d2', borderRadius: '0 0 12px 12px' }}>
        {Object.keys(ABAS).map(a => (
          <span key={a} onClick={() => setAba(a)} style={{ padding: '7px 16px', fontSize: 14, cursor: 'pointer', ...(aba === a ? { fontWeight: 600, background: 'var(--card)', borderTop: '2px solid var(--dg)' } : { color: 'var(--mute)' }) }}>{a}</span>
        ))}
      </div>
      <div className="lab" style={{ fontSize: 14, marginTop: 14 }}>Duas abas: Detalhada (um item por linha) e Simples (uma compra por linha, com a categoria de maior gasto). No rodapé: Total, Máximo e Mínimo dos valores em R$, com o estabelecimento e o item a que cada um se refere. Toque nas abas para conferir antes de baixar.</div>
    </div>
  )
}
