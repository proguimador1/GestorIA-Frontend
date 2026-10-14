// Exportação da planilha simplificada (.xlsx; CSV se a biblioteca falhar).
import { sum } from './utils.js'

const HEAD = ['Data', 'Estabelecimento', 'Item', 'Categoria', 'Quantidade', 'Unidade', 'Preço unitário', 'Total do item']

export async function exportSheet(rows, mode, [s, e]) {
  const name = `GestorIA_${mode === 'month' ? s.slice(0, 7) : s + '_a_' + e}`
  const total = sum(rows.map(r => r[7]))
  try {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.aoa_to_sheet([HEAD, ...rows])
    const n = rows.length + 1
    ws['A' + (n + 1)] = { t: 's', v: 'Total' }
    ws['H' + (n + 1)] = { t: 'n', f: `SUM(H2:H${n})`, v: total }
    ws['!ref'] = `A1:H${n + 1}`
    ws['!cols'] = [10, 20, 24, 14, 10, 8, 14, 14].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Itens')
    XLSX.writeFile(wb, name + '.xlsx')
  } catch {
    const csv = '\ufeff' + [HEAD, ...rows, ['Total', '', '', '', '', '', '', total]]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = name + '.csv'
    a.click()
  }
}
