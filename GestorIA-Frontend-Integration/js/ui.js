'use strict';

// Componentes compartilhados: menu, cabeçalho, barra de filtros, botão e prévia da planilha.
function chrome(r) {
  const N = [
    ['inicio', 'home', 'Início'],
    ['cadastro', 'clip', 'Cadastro'],
    ['financas', 'chart', 'Finanças'],
    ['notas', 'rcpt', 'Notas fiscais'],
    ['chatbot', 'chat', 'Chatbot'],
    ['configuracoes', 'gear', 'Configurações']
  ];

  $('#nav').innerHTML = N.map((n) => `<a class="nav ${r == n[0] ? 'on' : ''}" href="#/${n[0]}">${ic(n[1], 20)}<span>${n[2]}</span></a>`).join('');
  $('#cnt').textContent = S.catalog + ' itens catalogados';
  $('#av').textContent = S.user.name[0];
}

const head = (eb, t) => `<div class="eyebrow mono">${eb}</div><h1>${t}</h1>`;

function filterBar(chips) {
  const [s, e] = range();

  return `
    <div class="fbar">
      <span class="seg ${F.mode == 'week' ? 'on' : ''}" data-a="mode" data-v="week">Semana</span>
      <span class="seg ${F.mode == 'month' ? 'on' : ''}" data-a="mode" data-v="month">Mês</span>
      <span class="seg ${F.mode == '30' ? 'on' : ''}" data-a="mode" data-v="30">Personalizado</span>
      <span class="chip dt">
        <button data-a="shift" data-v="-1">${ic('l', 15)}</button>
        ${dm(s)} – ${dm(e)}/${e.slice(2, 4)}
        <button data-a="shift" data-v="1">${ic('r', 15)}</button>
      </span>
      <span class="vr"></span>
      <span class="lab mono" style="font-size:10.5px">Atalho</span>
      <span class="sc" data-a="mode" data-v="30">Últimos 30 dias</span>
      ${chips ? `
        <div style="flex-basis:100%"></div>
        ${F.cat ? `<span class="chip fil"><i class="dot" style="background:${CATS[F.cat]}"></i>Categoria: ${F.cat}<button data-a="cat" data-v="">×</button></span>` : `<select class="chip" data-a="catsel"><option value="">Categoria: todas</option>${allCats().map((c) => `<option>${c}</option>`).join('')}</select>`}
        <select class="chip" data-a="estsel"><option value="">Estabelecimento: todos</option>${EST.map((e) => `<option value="${e.id}" ${F.est == e.id ? 'selected' : ''}>${e.name}</option>`).join('')}</select>
      ` : ''}
    </div>
  `;
}

const col = (c) => CATS[c] || CATS.Outros;
const capTxt = () => `Planilha de ${F.mode == 'month' ? lab() : dm(range()[0]) + '–' + dm(range()[1])} · ${F.cat || 'todas as categorias'} · ${F.est ? estName(F.est) : 'todos os estabelecimentos'}`;
const sheetBtn = () => `<span class="cap">${capTxt()}</span><button class="btn" data-a="sheet">${ic('dl', 17)}Gerar planilha</button>`;

function sheetCard() {
  const R = sheetRows();
  const ne = new Set(R.map((r) => r[1])).size;
  const nn = new Set(items(range()).map((i) => i.n.id)).size;

  return `
    <div class="card" style="margin-top:0" id="prev">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
        <div>
          <div class="mono lab">Prévia da planilha</div>
          <div class="lab" style="margin-top:8px;font-size:13px">Planilha simplificada · ${R.length} itens · ${nn} notas · ${ne} estabelecimentos · ${lab()}</div>
        </div>
        <button class="btn dk" data-a="xlsx" ${R.length ? '' : 'disabled'}>${ic('dl', 17)}Baixar planilha (.xlsx)</button>
      </div>
      <div class="scr" style="margin-top:20px;border-radius:12px 12px 0 0">
        <table class="sheet" style="min-width:900px;border-collapse:collapse">
          <tr>
            ${['Data', 'Estabelecimento', 'Item', 'Categoria', 'Qtd', 'Un.', 'Preço unit.', 'Total do item'].map((h) => `<th style="padding:9px 12px;font-size:10.5px">${h}</th>`).join('')}
          </tr>
          ${R.slice(0, 5).map((r) => `
            <tr>
              ${r.map((v, k) => `<td style="padding:8px 12px;font-size:13px;${k > 3 && k != 5 ? 'text-align:right' : ''}">${k > 5 ? brl(v) : v}</td>`).join('')}
            </tr>
          `).join('') || `<tr><td colspan="8" class="lab" style="padding:16px">Nenhum item neste período.</td></tr>`}
          ${R.length > 5 ? `<tr><td colspan="8" class="lab" style="padding:8px 12px">… e mais ${R.length - 5} linhas</td></tr>` : ''}
          <tr>
            <td colspan="7" style="padding:8px 12px;font-weight:600">Total</td>
            <td style="padding:8px 12px;text-align:right;font-weight:600">${brl(sum(R.map((r) => r[7])))}</td>
          </tr>
        </table>
      </div>
      <div style="display:flex;background:#e6e2d2;border-radius:0 0 12px 12px">
        <span style="padding:7px 16px;font-size:12.5px;font-weight:600;background:var(--card);border-top:2px solid var(--dg)">Itens</span>
      </div>
      <div class="lab" style="font-size:12.5px;margin-top:14px">Uma aba com todos os itens do período e o total no rodapé.</div>
    </div>
  `;
}

// Menu do perfil (clique no círculo do usuário, canto superior direito)
function profileMenu() {
  const u = S.user;
  const ns = S.notes.length;
  const me = new Set(S.notes.map((n) => n.est)).size;

  return `
    <div class="pm-h">
      <div class="av big">${esc(u.name[0])}</div>
      <div>
        <b>${esc(u.name)}</b>
        <div class="lab" style="font-size:12.5px">${esc(u.email)}</div>
      </div>
    </div>
    <div class="pm-s">
      <div><b>${ns}</b><span>notas</span></div>
      <div><b>${S.catalog}</b><span>itens catalogados</span></div>
      <div><b>${me}</b><span>mercados</span></div>
    </div>
    <div class="pm-a">
      <a href="#/configuracoes">Editar perfil</a>
      <a href="#/chatbot">Falar com o chatbot</a>
      <span data-a="meusdados">Exportar meus dados (.json)</span>
      <span data-a="reset">Restaurar dados de demonstração</span>
    </div>
  `;
}
