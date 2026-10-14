// Dados de demonstração (gerados por regra, sem backend). Troque por chamadas à sua API.
export const APP_TODAY='2026-08-29'; // data "de hoje" da demo; use null para a data real
export const EST=[{id:'pao',name:'Pão de Açúcar',cnpj:'33.041.260/0652-90',f:1.12},{id:'sao',name:'São Luiz',cnpj:'07.234.118/0001-45',f:1},{id:'feira',name:'Feira',cnpj:'12.887.004/0001-02',f:.88},{id:'bom',name:'Mercado Bom Preço',cnpj:'09.118.552/0001-30',f:1.04}];
export const CATS={Hortifruti:'#2E4429',Mercearia:'#C0402A',Laticínios:'#E3A53A',Carnes:'#8C5A3C',Outros:'#9A9A8A'};
const CAT={Hortifruti:[['Tomate italiano','kg',8.5],['Banana prata','kg',5.9],['Alface crespa','un',3.5],['Cebola','kg',5.2],['Batata inglesa','kg',6.8],['Maçã fuji','kg',10.9],['Cenoura','kg',4.6]],
Laticínios:[['Leite integral','L',5.9],['Queijo muçarela','kg',48],['Iogurte natural','un',6.5],['Manteiga','un',14]],
Mercearia:[['Arroz tipo 1 (5 kg)','un',28.9],['Feijão carioca','un',8.5],['Azeite extra virgem','un',39.9],['Café','un',18.9],['Macarrão','un',5.2]]};
const STORE={Hortifruti:'geladeira',Laticínios:'geladeira',Mercearia:'despensa',Carnes:'freezer'};
// [dia, estabelecimento, Hortifruti, Laticínios, Mercearia]
const AUG=[[29,0,70,164,106],[27,0,0,39,40],[26,1,50,0,62],[23,0,30,34,30],[20,1,55,70,50],[17,0,70,0,58],[14,2,160,0,0],[11,1,0,56,40],[8,1,45,40,0],[6,3,0,0,70],[4,2,118,0,0],[1,0,40,22,0]];
const H=[55,50,60,45,55,60,50,55,60,45,50],L=[30,40,35,32,38,34,36,35,40,30,34],M=[35,30,40,38,32,36,34,40,35,30,36],D=[2,5,8,10,13,16,19,22,25,28,30],E=[0,1,2,0,1,3,0,1,2,0,1];
const JUL=D.map((d,i)=>[d,E[i],H[i],L[i],M[i]]);
function mk(spec,mm,seed){return spec.map((s,n)=>{const e=EST[s[1]],items=[];
 ['Hortifruti','Laticínios','Mercearia'].forEach((c,k)=>{const A=s[2+k];if(!A)return;const a=Math.round(A*.6*100)/100,parts=A>25?[a,Math.round((A-a)*100)/100]:[A];
  parts.forEach((t,j)=>{const it=CAT[c][(n*2+k+j*3)%CAT[c].length],step=it[1]=='kg'?.1:1,q=Math.max(step,Math.round(t/(it[2]*e.f)/step)*step),qq=Math.round(q*10)/10;
   items.push({name:it[0],cat:c,qty:qq,unit:it[1],unitPrice:Math.round(t/qq*100)/100,total:t,storage:STORE[c]})})});
 const d=String(s[0]).padStart(2,'0');return{id:'n'+mm+d,nf:(e.id=='feira'?'':String(4000+n*37+seed)),est:e.id,date:`2026-${mm}-${d}`,items,total:items.reduce((a,b)=>a+b.total,0)}})}
export const SEED_NOTES=mk(AUG,'08',700).concat(mk(JUL,'07',300));
// Notas que o "scanner" devolve na demo (no produto real: consulta da NFC-e pelo QR Code)
export const SAMPLES=[
{est:'sao',nf:'118301',date:'2026-08-24',items:[['Tomate italiano',1.2,'kg',11.4,'Hortifruti','geladeira'],['Arroz agulhinha 5kg',1,'un',27.9,'Mercearia','despensa'],['Peito de frango',900,'g',23.5,'Carnes','freezer'],['Cebola roxa',600,'g',6.2,'Hortifruti','despensa']]},
{est:'pao',nf:'004911',date:'2026-08-21',items:[['Leite sem lactose',2,'L',15.8,'Laticínios','geladeira'],['Azeite extra virgem',500,'ml',39.9,'Mercearia','despensa'],['Ovos caipira',12,'un',18.4,'Laticínios','geladeira']]},
{est:'feira',nf:'',date:'2026-08-18',items:[['Banana prata',1.5,'kg',8.7,'Hortifruti','despensa'],['Alface crespa',2,'un',5,'Hortifruti','geladeira'],['Manjericão',1,'maço',3.5,'Hortifruti','geladeira']]}];
