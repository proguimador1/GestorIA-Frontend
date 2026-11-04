// Gera src/data/notas.json: base fictícia de notas de supermercado (somente alimentos).
// Reprodutível: a mesma semente gera sempre o mesmo arquivo.
// Uso: npm run gerar-base            (padrão: 1000 notas, 2024-08-01 a 2026-09-30)
//      npm run gerar-base -- 1500    (outra quantidade de notas)
import { writeFileSync } from 'node:fs'

const TOTAL_NOTAS = Number(process.argv[2]) || 1000
const INICIO = '2024-08-01', FIM = '2026-09-30'
const SAIDA = 'src/data/notas.json'

// Gerador pseudoaleatório com semente fixa (mulberry32)
let semente = 20260930
const rnd = () => { semente |= 0; semente = (semente + 0x6D2B79F5) | 0; let t = Math.imul(semente ^ (semente >>> 15), 1 | semente); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const entre = (a, b) => a + rnd() * (b - a)
const sorteio = pesos => { let r = rnd() * pesos.reduce((s, p) => s + p, 0); for (let i = 0; i < pesos.length; i++) { r -= pesos[i]; if (r < 0) return i } return pesos.length - 1 }

const EMITENTES = [
  ['Mercantil São José Ltda.', '12.345.678/0001-95'], ['Supermercado Nordeste Ltda.', '23.456.789/0001-06'],
  ['Comercial Bom Preço Ltda.', '34.567.890/0001-17'], ['Mercadinho Fortaleza Ltda.', '45.678.901/0001-28'],
  ['Supermercado Alimentos Brasil Ltda.', '56.789.012/0001-39'], ['Mercantil Família Ltda.', '67.890.123/0001-40'],
  ['Comercial Varejista Ceará Ltda.', '78.901.234/0001-51'], ['Mercadinho Central Ltda.', '89.012.345/0001-62'],
].map(([nome, cnpj], i) => ({ id: 's' + (i + 1), nome, cnpj }))
const PESO_EMITENTE = [22, 18, 15, 12, 10, 9, 8, 6]   // a família prefere alguns mercados
const FATOR_EMITENTE = [1.00, 0.97, 0.95, 1.04, 1.02, 0.99, 0.96, 1.06] // nível de preço de cada mercado

// Catálogo: [nome, categoria, unidade, preço de referência em set/2026 (R$ por un, kg ou dz), frequência, faixa de quantidade]
const CAT = [
  ['Arroz branco tipo 1 Camil 1 kg', 'Mercearia', 'un', 6.49, 6, [1, 3]], ['Arroz branco tipo 1 Tio João 1 kg', 'Mercearia', 'un', 7.29, 4, [1, 2]],
  ['Feijão carioca Kicaldo 1 kg', 'Mercearia', 'un', 8.49, 5, [1, 2]], ['Feijão carioca Dona De 1 kg', 'Mercearia', 'un', 7.99, 3, [1, 2]],
  ['Açúcar cristal Ecoçúcar 1 kg', 'Mercearia', 'un', 4.59, 4, [1, 2]], ['Café Melitta 500 g', 'Mercearia', 'un', 28.90, 3, [1, 1]],
  ['Café União 250 g', 'Mercearia', 'un', 15.49, 3, [1, 2]], ['Óleo de soja Soya 900 ml', 'Mercearia', 'un', 8.79, 3, [1, 2]],
  ['Macarrão Dona Benta 500 g', 'Mercearia', 'un', 4.99, 4, [1, 3]], ['Macarrão Fortaleza espaguete 400 g', 'Mercearia', 'un', 3.89, 3, [1, 3]],
  ['Farinha de trigo Finna 1 kg', 'Mercearia', 'un', 5.49, 2, [1, 1]], ['Farinha de mandioca 1 kg', 'Mercearia', 'un', 7.49, 2, [1, 1]],
  ['Flocão de milho Dona Clara 500 g', 'Mercearia', 'un', 2.79, 3, [1, 3]], ['Flocão Vitamilho 500 g', 'Mercearia', 'un', 2.99, 2, [1, 3]],
  ['Sal refinado Lebre 1 kg', 'Mercearia', 'un', 2.99, 1, [1, 1]], ['Molho de tomate Fugini 300 g', 'Mercearia', 'un', 2.69, 4, [1, 3]],
  ['Milho verde Predilecta 170 g', 'Mercearia', 'un', 3.79, 2, [1, 2]], ['Sardinha Gomes da Costa 125 g', 'Mercearia', 'un', 7.49, 2, [1, 3]],
  ['Atum sólido Coqueiro 170 g', 'Mercearia', 'un', 10.99, 2, [1, 2]], ['Maionese Hellmann’s 500 g', 'Mercearia', 'un', 13.49, 2, [1, 1]],
  ['Ketchup Heinz 397 g', 'Mercearia', 'un', 14.90, 1, [1, 1]], ['Tempero completo Kitano 300 g', 'Mercearia', 'un', 7.99, 1, [1, 1]],
  ['Achocolatado Nescau 370 g', 'Mercearia', 'un', 10.49, 2, [1, 1]], ['Chocolate em pó 200 g', 'Mercearia', 'un', 9.49, 1, [1, 1]],
  ['Aveia Quaker 165 g', 'Mercearia', 'un', 6.99, 1, [1, 2]], ['Granola Mãe Terra 250 g', 'Mercearia', 'un', 15.90, 1, [1, 1]],
  ['Farinha láctea Nestlé 210 g', 'Mercearia', 'un', 9.99, 1, [1, 1]], ['Amido de milho Kimimo 200 g', 'Mercearia', 'un', 4.49, 1, [1, 1]],
  ['Azeite Gallo 250 ml', 'Mercearia', 'un', 27.90, 1, [1, 1]], ['Pipoca para micro-ondas Yoki', 'Mercearia', 'un', 4.29, 1, [1, 3]],
  ['Leite integral Italac 1 L', 'Laticínios', 'un', 5.99, 8, [2, 6]], ['Iogurte natural 170 g', 'Laticínios', 'un', 3.49, 3, [2, 6]],
  ['Manteiga 200 g', 'Laticínios', 'un', 12.90, 2, [1, 1]], ['Queijo muçarela fatiado 200 g', 'Laticínios', 'un', 11.90, 3, [1, 2]],
  ['Creme de leite Betânia 200 g', 'Laticínios', 'un', 3.99, 2, [1, 2]], ['Leite condensado Betânia 395 g', 'Laticínios', 'un', 7.49, 2, [1, 2]],
  ['Ovos brancos dúzia', 'Laticínios', 'dz', 13.90, 5, [1, 2]],
  ['Pão francês', 'Padaria', 'kg', 16.90, 8, [0.25, 0.7]], ['Pão de forma Visconti 400 g', 'Padaria', 'un', 8.49, 3, [1, 1]],
  ['Biscoito cream cracker Fortaleza 350 g', 'Padaria', 'un', 5.49, 3, [1, 2]], ['Biscoito Richester Amori 125 g', 'Padaria', 'un', 2.99, 2, [1, 3]],
  ['Banana prata', 'Hortifruti', 'kg', 6.99, 6, [0.8, 2]], ['Tomate', 'Hortifruti', 'kg', 8.49, 6, [0.4, 1.2]],
  ['Cebola', 'Hortifruti', 'kg', 5.99, 5, [0.4, 1]], ['Batata inglesa', 'Hortifruti', 'kg', 6.49, 4, [0.6, 1.5]],
  ['Cenoura', 'Hortifruti', 'kg', 5.49, 3, [0.4, 1]], ['Laranja pera', 'Hortifruti', 'kg', 4.99, 3, [1, 2.5]],
  ['Maçã nacional', 'Hortifruti', 'kg', 10.99, 3, [0.5, 1.2]], ['Mamão formosa', 'Hortifruti', 'kg', 6.49, 2, [1, 2]],
  ['Abacate', 'Hortifruti', 'kg', 8.99, 1, [0.6, 1.4]], ['Alface unidade', 'Hortifruti', 'un', 3.49, 3, [1, 2]],
  ['Cheiro-verde maço', 'Hortifruti', 'un', 2.49, 3, [1, 1]],
  ['Patinho bovino', 'Carnes', 'kg', 49.90, 3, [0.5, 1.5]], ['Carne moída bovina', 'Carnes', 'kg', 39.90, 3, [0.5, 1.2]],
  ['Peito de frango Jaguá 1 kg', 'Carnes', 'kg', 18.90, 4, [0.8, 2]], ['Filezinho sassami Super Frango 1 kg', 'Carnes', 'kg', 22.90, 2, [0.8, 1.5]],
  ['Linguiça calabresa Perdigão 400 g', 'Carnes', 'un', 13.49, 2, [1, 2]], ['Hambúrguer bovino Seara 672 g', 'Carnes', 'un', 19.90, 1, [1, 1]],
  ['Pizza congelada Sadia 460 g', 'Congelados', 'un', 19.90, 1, [1, 1]], ['Polpa de fruta 100 g', 'Congelados', 'un', 2.29, 2, [2, 6]],
  ['Sorvete Kibon 1,5 L', 'Congelados', 'un', 29.90, 1, [1, 1]],
  ['Refrigerante Coca-Cola 2 L', 'Bebidas', 'un', 11.49, 3, [1, 2]], ['Suco de uva integral 1 L', 'Bebidas', 'un', 14.90, 1, [1, 2]],
  ['Água mineral 1,5 L', 'Bebidas', 'un', 2.99, 3, [2, 6]],
]

const PAGAMENTO = [['Pix', 35], ['Cartão de crédito', 30], ['Cartão de débito', 25], ['Em espécie', 10]]
const iso = d => d.toISOString().slice(0, 10)
const dia = s => new Date(s + 'T00:00:00Z')
const r2 = v => Math.round(v * 100) / 100
const r3 = v => Math.round(v * 1000) / 1000
const terminaEm9 = v => Math.max(0.49, Math.floor(v * 10) / 10 + 0.09) // preços de prateleira: R$ x,x9

// Preço de cada produto em cada mercado: referência x nível do mercado x pequena variação própria
const precoBase = CAT.map(() => FATOR_EMITENTE.map(f => f * entre(0.96, 1.04)))
const anosAteFim = d => (dia(FIM) - d) / (365.25 * 864e5)
const preco = (p, e, d) => terminaEm9(CAT[p][3] * precoBase[p][e] / Math.pow(1.045, anosAteFim(d))) // inflação de ~4,5% ao ano

// Distribuição das notas. Cada mês recebe uma quantidade proporcional aos seus dias (maiores restos arredondam para cima),
// com a mesma rotina: uma compra grande por semana e reposições rápidas nos outros dias. Assim não há meses muito destoantes.
const dias = []; for (let d = dia(INICIO); d <= dia(FIM); d.setUTCDate(d.getUTCDate() + 1)) dias.push(new Date(d))
const meses = {}; dias.forEach(d => (meses[iso(d).slice(0, 7)] ||= []).push(d))
const cotas = Object.values(meses).map(ds => TOTAL_NOTAS * ds.length / dias.length)
const porMes = cotas.map(Math.floor)
cotas.map((c, i) => [c - Math.floor(c), i]).sort((a, b) => b[0] - a[0]).slice(0, TOTAL_NOTAS - porMes.reduce((s, c) => s + c, 0)).forEach(([, i]) => porMes[i]++)

const agenda = [] // [data, compra grande?]
Object.values(meses).forEach((ds, m) => {
  const grandes = ds.filter(d => d.getUTCDay() === 6)               // compra grande aos sábados
  grandes.forEach(d => agenda.push([d, true]))
  const pesoDia = ds.map(d => [1.2, 0.9, 0.9, 1.0, 1.0, 1.2, 0.6][d.getUTCDay()])
  for (let k = 0; k < porMes[m] - grandes.length; k++) agenda.push([ds[sorteio(pesoDia)], false])
})
agenda.sort((a, b) => a[0] - b[0])
// O período cobre exatamente INICIO a FIM: a primeira e a última reposição caem nesses dias
agenda.find(a => !a[1])[0] = dia(INICIO)
agenda.findLast(a => !a[1])[0] = dia(FIM)
agenda.sort((a, b) => a[0] - b[0])

// Dígito verificador da chave de acesso (módulo 11), como na NFC-e real
const dv = s => { let soma = 0, peso = 2; for (let i = s.length - 1; i >= 0; i--) { soma += +s[i] * peso; peso = peso === 9 ? 2 : peso + 1 } const r = soma % 11; return r < 2 ? 0 : 11 - r }

const notas = []
let numero = 0
agenda.forEach(([d, grande]) => {
  {
    numero++
    const e = sorteio(PESO_EMITENTE)
    const nItens = grande ? Math.round(entre(11, 16)) : Math.round(entre(2, 5))
    const escolhidos = new Set()
    while (escolhidos.size < nItens) escolhidos.add(sorteio(CAT.map(p => p[4])))
    const itens = [...escolhidos].map(p => {
      const [nome, categoria, unidade, , , [qMin, qMax]] = CAT[p]
      const quantidade = unidade === 'kg' ? r3(entre(qMin, qMax)) : Math.round(entre(qMin, qMax))
      const valorUnitario = preco(p, e, d)
      return { nome, categoria, quantidade, unidade, valorUnitario, valorTotal: r2(quantidade * valorUnitario) }
    })
    const n = String(numero).padStart(6, '0')
    const yymm = iso(d).slice(2, 4) + iso(d).slice(5, 7)
    const base43 = '23' + yymm + EMITENTES[e].cnpj.replace(/\D/g, '') + '65' + '206' + n.padStart(9, '0') + '1' + String(Math.floor(rnd() * 1e8)).padStart(8, '0')
    notas.push({
      id: 'nfce-' + n, numero: n, codigo: 'NFCT-' + n, chave: base43 + dv(base43),
      emitente: EMITENTES[e].id, data: iso(d), pagamento: PAGAMENTO[sorteio(PAGAMENTO.map(p => p[1]))][0],
      total: r2(itens.reduce((s, i) => s + i.valorTotal, 0)), itens,
    })
  }
})

writeFileSync(SAIDA, JSON.stringify({ emitentes: EMITENTES, notas }))
const mes = {}; notas.forEach(n => { mes[n.data.slice(0, 7)] = (mes[n.data.slice(0, 7)] || 0) + n.total })
const v = Object.values(mes)
console.log(`${notas.length} notas, ${notas.reduce((s, n) => s + n.itens.length, 0)} itens, ${Object.keys(mes).length} meses -> ${SAIDA}`)
console.log(`Gasto mensal: mínimo R$ ${Math.min(...v).toFixed(2)}, médio R$ ${(v.reduce((s, x) => s + x, 0) / v.length).toFixed(2)}, máximo R$ ${Math.max(...v).toFixed(2)}`)
