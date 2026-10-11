"use strict";
// Notas fiscais: histórico de notas e prévia da planilha.
P.notas = () => {
  const r = range(),
    q = F.q.toLowerCase(),
    base = S.notes
      .filter(
        (n) =>
          (F.all || (n.date >= r[0] && n.date <= r[1])) &&
          (!F.est || n.est == F.est) &&
          (!F.cat || n.items.some((i) => i.cat == F.cat)),
      )
      .filter(
        (n) =>
          !q ||
          [estName(n.est), n.nf, ...n.items.map((i) => i.name)]
            .join(" ")
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  const rows = base
    .map(
      (n) =>
        `<tr class="hov" data-a="open" data-v="${n.id}" style="${F.open == n.id ? "background:#ece8d9" : ""}"><td class="mono" style="font-size:12.5px">${dmy(n.date)}</td><td class="mono lab" style="font-size:12.5px">${n.nf || "—"}</td><td><b style="font-weight:500">${estName(n.est)}</b></td><td>${n.items.length} itens</td><td class="r serif" style="font-weight:600;font-size:15.5px">${brl(n.total)}</td><td class="r lab">${F.open == n.id ? "▴" : "▾"}</td></tr>` +
        (F.open == n.id
          ? `<tr style="background:#ece8d9"><td colspan="6" style="padding:0 18px 18px"><div style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:6px 8px"><table><tr><th style="background:none">Item</th><th style="background:none">Quantidade</th><th class="r" style="background:none">Preço unitário</th><th class="r" style="background:none">Total do item</th></tr>${n.items.map((i) => `<tr><td style="border:0"><b style="font-weight:500">${esc(i.name)}</b></td><td style="border:0">${i.qty} ${i.unit}</td><td class="r" style="border:0">${brl(i.unitPrice)}</td><td class="r serif" style="border:0;font-weight:600">${brl(i.total)}</td></tr>`).join("")}</table><div style="padding:8px 10px"><span class="sc" data-a="del" data-v="${n.id}" style="color:var(--red)">Excluir nota</span></div></div></td></tr>`
          : ""),
    )
    .join("");
  const prow = items(r).length;
  return (
    head(
      "Notas fiscais · " + lab().toUpperCase(),
      "Nota por nota, item por item",
    ) +
    `<div class="tabrow"><div class="tab on">Por nota</div>${sheetBtn()}</div>` +
    filterBar(true) +
    `<div class="card mt"><div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div><div class="mono lab">Histórico de notas</div><div class="lab" style="font-size:13px;margin-top:8px">Toque numa nota para ver os itens comprados</div></div><input id="q" style="max-width:380px;border-radius:20px" placeholder="Buscar item, nota ou estabelecimento" value="${esc(F.q)}"></div>
<div class="lab" style="font-size:12px;margin:10px 0 14px;text-align:right">Buscando em: ${F.all ? "todo o histórico" : lab()} · ${F.cat || "todas as categorias"} · ${F.est ? estName(F.est) : "todos os estabelecimentos"}</div>
${base.length ? `<table><thead><tr><th>Data da nota</th><th>Nº da nota</th><th>Estabelecimento</th><th>Itens</th><th class="r">Total da nota</th><th></th></tr></thead><tbody>${rows}</tbody></table><div style="display:flex;justify-content:space-between;padding-top:16px" class="lab"><span>${base.length} notas · ${sum(base.map((n) => n.items.length))} itens</span><b class="serif" style="color:var(--ink);font-size:16px">Total ${brl(sum(base.map((n) => n.total)))}</b></div>` : `<div class="empty">Nenhum resultado neste período.${F.all ? "" : `<br><span class="sc" data-a="all">Buscar em todo o histórico?</span>`}</div>`}</div><div class="mt">${sheetCard()}</div>`
  );
};
