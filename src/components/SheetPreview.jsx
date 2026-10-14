import Icon from './Icon.jsx'
import { useApp } from '../store/AppContext.jsx'
import { exportSheet } from '../lib/export.js'
import { brl, sum } from '../lib/utils.js'

// Prévia da planilha simplificada (aba única "Itens", com total no rodapé) e botão de download.
export default function SheetPreview() {
  const { F, fin, toast } = useApp()
  const rows = fin.sheetRows()
  const nn = new Set(fin.items(fin.range()).map(i => i.n.id)).size
  const ne = new Set(rows.map(r => r[1])).size
  const baixar = async () => { await exportSheet(rows, F.mode, fin.range()); toast('Planilha gerada') }
  return (
    <div className="card" id="prev">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="mono lab">Prévia da planilha</div>
          <div className="lab" style={{ marginTop: 8, fontSize: 13 }}>Planilha simplificada · {rows.length} itens · {nn} notas · {ne} estabelecimentos · {fin.lab()}</div>
        </div>
        <button className="btn dk" onClick={baixar} disabled={!rows.length}><Icon n="dl" s={17} />Baixar planilha (.xlsx)</button>
      </div>
      <div className="scr" style={{ marginTop: 20, borderRadius: '12px 12px 0 0' }}>
        <table className="sheet" style={{ minWidth: 900, borderCollapse: 'collapse' }}>
          <tbody>
            <tr>{['Data', 'Estabelecimento', 'Item', 'Categoria', 'Qtd', 'Un.', 'Preço unit.', 'Total do item'].map(h => <th key={h} style={{ padding: '9px 12px', fontSize: 10.5 }}>{h}</th>)}</tr>
            {rows.slice(0, 5).map((r, i) => (
              <tr key={i}>{r.map((v, k) => <td key={k} style={{ padding: '8px 12px', fontSize: 13, textAlign: k > 3 && k !== 5 ? 'right' : 'left' }}>{k > 5 ? brl(v) : v}</td>)}</tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="lab" style={{ padding: 16 }}>Nenhum item neste período.</td></tr>}
            {rows.length > 5 && <tr><td colSpan={8} className="lab" style={{ padding: '8px 12px' }}>… e mais {rows.length - 5} linhas</td></tr>}
            <tr><td colSpan={7} style={{ padding: '8px 12px', fontWeight: 600 }}>Total</td><td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{brl(sum(rows.map(r => r[7])))}</td></tr>
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', background: '#e6e2d2', borderRadius: '0 0 12px 12px' }}>
        <span style={{ padding: '7px 16px', fontSize: 12.5, fontWeight: 600, background: 'var(--card)', borderTop: '2px solid var(--dg)' }}>Itens</span>
      </div>
      <div className="lab" style={{ fontSize: 12.5, marginTop: 14 }}>Uma aba com todos os itens do período e o total no rodapé.</div>
    </div>
  )
}
