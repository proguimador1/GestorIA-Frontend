// Exportação da planilha .xlsx com duas abas: "Detalhada" (um item por linha) e "Simples" (uma compra por linha).
// As larguras das colunas se ajustam ao maior texto de cada coluna. Se a biblioteca falhar, baixa dois arquivos CSV.
import { sum } from './utils.js'

export const ABAS = {
  Detalhada: { head: ['Data', 'Estabelecimento', 'Item', 'Categoria', 'Quantidade', 'Unidade', 'Preço unitário', 'Total do item'], moeda: [6, 7], total: 7 },
  Simples: { head: ['Data', 'Estabelecimento', 'Quantidade de itens', 'Categoria principal', 'Total da compra'], moeda: [4], total: 4 },
}
const MOEDA = '"R$" #,##0.00'
const textoCelula = (v, moeda) => moeda ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v)

// Monta a aba: cabeçalho, linhas, linha de total com fórmula, formato de moeda e largura automática.
function montarAba(XLSX, { head, moeda, total }, rows) {
  const ws = XLSX.utils.aoa_to_sheet([head, ...rows])
  const n = rows.length + 1, col = XLSX.utils.encode_col(total), ult = XLSX.utils.encode_col(head.length - 1)
  const soma = sum(rows.map(r => r[total]))
  ws['A' + (n + 1)] = { t: 's', v: 'Total' }
  ws[col + (n + 1)] = { t: 'n', f: `SUM(${col}2:${col}${n})`, v: soma, z: MOEDA }
  ws['!ref'] = `A1:${ult}${n + 1}`
  rows.forEach((_, r) => moeda.forEach(c => { const cel = ws[XLSX.utils.encode_cell({ r: r + 1, c })]; if (cel) cel.z = MOEDA }))
  const linhas = [head, ...rows.map(r => r.map((v, c) => textoCelula(v, moeda.includes(c)))), ['Total', textoCelula(soma, true)]]
  ws['!cols'] = head.map((_, c) => ({ wch: Math.min(60, Math.max(...linhas.map(l => String(l[c] ?? '').length)) + 2) }))
  return ws
}

export async function exportSheet(abas, mode, [s, e]) {
  const nome = `GestorIA_${mode === 'month' ? s.slice(0, 7) : s + '_a_' + e}`
  try {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    Object.entries(ABAS).forEach(([aba, cfg]) => XLSX.utils.book_append_sheet(wb, montarAba(XLSX, cfg, abas[aba]), aba))
    XLSX.writeFile(wb, nome + '.xlsx')
  } catch {
    Object.entries(ABAS).forEach(([aba, { head, total }]) => {
      const rows = abas[aba], fim = head.map((_, c) => c === 0 ? 'Total' : c === total ? sum(rows.map(r => r[total])) : '')
      const csv = '﻿' + [head, ...rows, fim].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      a.download = `${nome}_${aba}.csv`
      a.click()
    })
  }
}
