// Cores das categorias. Os dados vêm da API (Django); o notas.json fictício não é mais importado pelo app.
// Cores fixas por categoria. As demais recebem cores da PALETTE automaticamente.
export const CATS = { Outros: '#9A9A8A' }
// Paleta de reserva: cores atribuídas automaticamente às categorias, na ordem alfabética.
export const PALETTE=['#2E4429','#C0402A','#E3A53A','#8C5A3C','#3B6E8F','#D9822B','#5B8E7D','#A23B72','#6C4F9A','#2F8F83','#C9A227','#8F2D56','#D1495B','#00798C','#7A9E3B','#B5651D','#6D597A','#B56576','#E56B6F','#355070','#99B898','#E8A87C','#C38D9E','#41B3A3','#85A389','#9C6644','#588157','#BC6C25','#7B2CBF','#264653'];
// Cor de uma categoria: fixa se conhecida; senão, a próxima cor livre da paleta (ordem alfabética das categorias).
export const colorOf=(c,all)=>CATS[c]||PALETTE[all.filter(x=>!CATS[x]).sort().indexOf(c)%PALETTE.length]||CATS.Outros;
