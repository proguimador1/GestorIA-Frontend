// Formatação, datas e utilitários gerais.
import { EST, APP_TODAY } from '../data/seed.js'

export const brl = v => 'R$ ' + (+v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const pct = v => Math.round(v) + '%'
export const sum = a => a.reduce((x, y) => x + y, 0)
export const iso = d => d.toISOString().slice(0, 10)
export const dt = s => new Date(s + 'T00:00:00Z')
export const add = (s, n) => { const d = dt(s); d.setUTCDate(d.getUTCDate() + n); return iso(d) }
export const dm = s => s.slice(8) + '/' + s.slice(5, 7)
export const dmy = s => dm(s) + '/' + s.slice(0, 4)
export const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const today = () => APP_TODAY || iso(new Date())
export const estName = id => EST.find(e => e.id === id)?.name || id
export const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
