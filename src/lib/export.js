// Exportação da planilha .xlsx com duas abas: "Detalhada" (um item por linha) e "Simples" (uma compra por linha).
// As larguras das colunas se ajustam ao maior texto de cada coluna. Se a biblioteca falhar, baixa dois arquivos CSV.
// A formatação (cores, bordas, negrito) usa a biblioteca xlsx-js-style, que tem a mesma API da xlsx e grava estilos.
import { sum } from './utils.js'

// moeda: colunas em R$ · total: coluna somada no rodapé · extremos: colunas que recebem as linhas Máximo e Mínimo ·
// rotulos: colunas reaproveitadas nessas linhas para mostrar a que linha o valor se refere (estabelecimento e item)
export const ABAS = {
  Detalhada: { head: ['Data', 'Estabelecimento', 'Item', 'Categoria', 'Quantidade', 'Unidade', 'Preço unitário', 'Total do item'], moeda: [6, 7], total: 7, extremos: [6, 7], rotulos: [1, 2] },
  Simples: { head: ['Data', 'Estabelecimento', 'Quantidade de itens', 'Categoria principal', 'Total da compra'], moeda: [4], total: 4, extremos: [4], rotulos: [1] },
}

// Linhas Máximo e Mínimo do rodapé, iguais na prévia e no arquivo: uma por coluna de "extremos"
// (na Detalhada: preço unitário e total do item), com o estabelecimento e o item da linha que tem o valor.
export function linhasExtremos({ head, extremos, rotulos }, rows) {
  if (!rows.length) return []
  return [['max', 'Máximo'], ['min', 'Mínimo']].flatMap(([tipo, nome]) => extremos.map(col => {
    const vals = rows.map(r => Number(r[col]) || 0)
    const valor = tipo === 'max' ? Math.max(...vals) : Math.min(...vals)
    const linha = vals.indexOf(valor)
    return { tipo, col, valor, linha, nome: extremos.length > 1 ? `${nome} · ${head[col]}` : nome, rotulos: Object.fromEntries(rotulos.map(c => [c, rows[linha][c]])) }
  }))
}
const MOEDA = '"R$" #,##0.00'
const textoCelula = (v, moeda) => moeda ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v)

// Paleta da planilha, a mesma do app: verde-escuro no cabeçalho, linhas zebradas em bege, total em verde-claro,
// máximo em vermelho-claro e mínimo em verde-claro.
const COR = { escuro: '2E4429', verde: '4A6B3E', claro: 'D7E4CC', bege: 'F3EFE3', branco: 'FFFFFF', linha: 'DAD6C4', vermelho: 'C0402A', rosado: 'F6DED8', tinta: '1F1A14' }
const borda = (cor = COR.linha, estilo = 'thin') => ({ top: { style: estilo, color: { rgb: cor } }, bottom: { style: estilo, color: { rgb: cor } }, left: { style: 'thin', color: { rgb: COR.linha } }, right: { style: 'thin', color: { rgb: COR.linha } } })
const ESTILO = {
  cabecalho: { font: { bold: true, color: { rgb: COR.branco }, sz: 11 }, fill: { patternType: 'solid', fgColor: { rgb: COR.escuro } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: borda(COR.escuro) },
  linha: zebra => ({ font: { color: { rgb: COR.tinta }, sz: 11 }, fill: { patternType: 'solid', fgColor: { rgb: zebra ? COR.bege : COR.branco } }, border: borda() }),
  total: { font: { bold: true, color: { rgb: COR.escuro }, sz: 11 }, fill: { patternType: 'solid', fgColor: { rgb: COR.claro } }, border: { ...borda(), top: { style: 'medium', color: { rgb: COR.escuro } } } },
  maximo: { font: { bold: true, color: { rgb: COR.vermelho }, sz: 11 }, fill: { patternType: 'solid', fgColor: { rgb: COR.rosado } }, border: borda() },
  minimo: { font: { bold: true, color: { rgb: COR.verde }, sz: 11 }, fill: { patternType: 'solid', fgColor: { rgb: COR.claro } }, border: borda() },
}

// Monta a aba: cabeçalho, linhas, rodapé (Total, Máximo e Mínimo com fórmulas), moeda, cores e largura automática.
function montarAba(XLSX, cfg, rows) {
  const { head, moeda, total } = cfg
  const ws = XLSX.utils.aoa_to_sheet([head, ...rows])
  const n = rows.length + 1, ult = XLSX.utils.encode_col(head.length - 1)
  const L = c => XLSX.utils.encode_col(c)
  const soma = sum(rows.map(r => r[total]))
  const faixa = c => `${L(c)}2:${L(c)}${n}`
  // Rodapé: Total e, abaixo, as linhas Máximo e Mínimo (coluna A traz o nome da linha). Nas linhas Máximo e Mínimo,
  // as colunas Estabelecimento e Item mostram de onde vem o valor (fórmula ÍNDICE/CORRESP, que acompanha edições).
  const rodape = [{ nome: 'Total', estilo: ESTILO.total, col: total, f: `SUM(${faixa(total)})`, v: soma, rotulos: {} },
    ...linhasExtremos(cfg, rows).map(x => {
      const fn = x.tipo === 'max' ? 'MAX' : 'MIN'
      return { nome: x.nome, estilo: x.tipo === 'max' ? ESTILO.maximo : ESTILO.minimo, col: x.col, f: `${fn}(${faixa(x.col)})`, v: x.valor, rotulos: x.rotulos, alvo: `MATCH(${fn}(${faixa(x.col)}),${faixa(x.col)},0)` }
    })]
  rodape.forEach(({ nome, estilo, col: cv, f, v, rotulos, alvo }, k) => {
    const lin = n + 1 + k
    head.forEach((_, c) => {
      const ref = L(c) + lin
      ws[ref] = c === 0 ? { t: 's', v: nome, s: estilo }
        : c === cv ? { t: 'n', f, v: rows.length ? v : 0, z: MOEDA, s: { ...estilo, alignment: { horizontal: 'right' } } }
          : c in rotulos ? { t: 's', f: `INDEX(${faixa(c)},${alvo})`, v: String(rotulos[c]), s: estilo }
            : { t: 's', v: '', s: estilo }
    })
  })
  ws['!ref'] = `A1:${ult}${n + rodape.length}`
  head.forEach((_, c) => { ws[XLSX.utils.encode_cell({ r: 0, c })].s = ESTILO.cabecalho })
  rows.forEach((row, r) => row.forEach((_, c) => {
    const cel = ws[XLSX.utils.encode_cell({ r: r + 1, c })]
    if (!cel) return
    cel.s = ESTILO.linha(r % 2 === 1)
    if (moeda.includes(c)) { cel.z = MOEDA; cel.s = { ...cel.s, alignment: { horizontal: 'right' } } }
  }))
  const linhas = [head, ...rows.map(r => r.map((v, c) => textoCelula(v, moeda.includes(c)))), ...rodape.map(x => [x.nome, textoCelula(soma, true)])]
  ws['!cols'] = head.map((_, c) => ({ wch: Math.min(60, Math.max(...linhas.map(l => String(l[c] ?? '').length)) + 2) }))
  ws['!rows'] = [{ hpt: 22 }]
  return ws
}

export async function exportSheet(abas, mode, [s, e]) {
  const nome = `GestorIA_${mode === 'month' ? s.slice(0, 7) : s + '_a_' + e}`
  try {
    const XLSX = await import('xlsx-js-style')
    const wb = XLSX.utils.book_new()
    Object.entries(ABAS).forEach(([aba, cfg]) => XLSX.utils.book_append_sheet(wb, montarAba(XLSX, cfg, abas[aba]), aba))
    XLSX.writeFile(wb, nome + '.xlsx')
  } catch {
    Object.entries(ABAS).forEach(([aba, cfg]) => {
      const { head, total } = cfg, rows = abas[aba]
      const rod = [head.map((_, c) => c === 0 ? 'Total' : c === total ? sum(rows.map(r => Number(r[total]) || 0)) : ''),
        ...linhasExtremos(cfg, rows).map(x => head.map((_, c) => c === 0 ? x.nome : c === x.col ? x.valor : c in x.rotulos ? x.rotulos[c] : ''))]
      const csv = '﻿' + [head, ...rows, ...rod].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      a.download = `${nome}_${aba}.csv`
      a.click()
    })
  }
}
