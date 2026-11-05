// Formatação, datas e utilitários gerais.

export const brl = v => 'R$ ' + (+v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const pct = v => Math.round(v) + '%'
export const sum = a => a.reduce((x, y) => x + y, 0)
export const iso = d => d.toISOString().slice(0, 10)
export const dt = s => new Date(s + 'T00:00:00Z')
export const add = (s, n) => { const d = dt(s); d.setUTCDate(d.getUTCDate() + n); return iso(d) }
export const dm = s => s.slice(8) + '/' + s.slice(5, 7)
export const dmy = s => dm(s) + '/' + s.slice(0, 4)
export const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
// Data local (YYYY-MM-DD). toISOString usaria UTC e, à noite no Brasil, já seria o dia seguinte.
export const today = () => new Date().toLocaleDateString('sv-SE')
// O estabelecimento de cada nota já é o nome vindo da API.
export const estName = id => id || 'Estabelecimento não informado'
export const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
