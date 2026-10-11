"use strict";
// Finanças: Visão geral e Detalhamento.
P.financas = () => {
  const r = range(),
    pr = prevRange(),
    it = items(r),
    notes = [...new Set(it.map((i) => i.n.id))],
    tot = sum(it.map((i) => i.total)),
    pt = sum(items(pr).map((i) => i.total)),
    pn = new Set(items(pr).map((i) => i.n.id)).size,
    v = tot - pt;
  const tabs = `<div class="tabrow">${[
    ["visao", "Visão geral"],
    ["det", "Detalhamento"],
  ]
    .map(
      (t) =>
        `<div class="tab ${F.tab == t[0] ? "on" : ""}" data-a="ftab" data-v="${t[0]}">${t[1]}</div>`,
    )
    .join("")}${sheetBtn()}</div>`;
  return (
    head(
      "Finanças · " + lab().toUpperCase(),
      "Para onde foi o dinheiro da cozinha",
    ) +
    tabs +
    filterBar(F.tab == "det" || F.cat || F.est) +
    (F.tab == "visao"
      ? visao(tot, pt, notes.length, pn, r)
      : det(tot, r, notes))
  );
};
function visao(tot, pt, nn, pn, r) {
  const avg = nn ? tot / nn : 0,
    pavg = pn ? pt / pn : 0,
    pl = prevLab(),
    cm = items(r, { est: F.est }),
    bt = {};
  const catD = Object.entries(
      items(r, { cat: "" })
        .filter((i) => !F.est || i.n.est == F.est)
        .reduce((m, i) => ((m[i.cat] = (m[i.cat] || 0) + i.total), m), {}),
    ).sort((a, b) => b[1] - a[1]),
    cTot = sum(catD.map((c) => c[1]));
  const bars = EST.map((e) => {
      const ns = notesIn(r, { est: e.id }).filter((n) => nTot(n, F.cat)),
        t = sum(ns.map((n) => nTot(n, F.cat)));
      return { e, n: ns.length, t, m: ns.length ? t / ns.length : 0 };
    })
      .filter((b) => b.n)
      .sort(
        (a, b) =>
          b[F.bar == "total" ? "t" : "m"] - a[F.bar == "total" ? "t" : "m"],
      ),
    bm = Math.max(1, ...bars.map((b) => b[F.bar == "total" ? "t" : "m"]));
  const pc = items(prevRange(), { cat: "" }).reduce(
      (m, i) => ((m[i.cat] = (m[i.cat] || 0) + i.total), m),
      {},
    ),
    gr = catD
      .filter((c) => pc[c[0]])
      .map((c) => [c[0], c[1] / pc[c[0]] - 1])
      .sort((a, b) => b[1] - a[1])[0],
    days = Object.entries(byDay(r)).sort((a, b) => b[1].v - a[1].v)[0];
  const ins = [];
  if (catD[0])
    ins.push([
      col(catD[0][0]),
      `${catD[0][0]} é a maior fatia do período: ${pct((catD[0][1] / cTot) * 100)} do gasto, ou ${brl(catD[0][1])}.`,
      "Ver itens",
      "cat",
      catD[0][0],
    ]);
  if (gr)
    ins.push([
      col(gr[0]),
      `${gr[0]} ${gr[1] >= 0 ? "subiu" : "caiu"} ${pct(Math.abs(gr[1]) * 100)} em relação a ${pl}.${gr[1] > 0 ? " É a categoria que mais cresceu." : ""}`,
      "Ver itens",
      "cat",
      gr[0],
    ]);
  if (days)
    ins.push([
      "#E3A53A",
      `O dia mais caro foi ${dm(days[0])}: ${brl(days[1].v)} ${days[1].n.length == 1 ? "em uma única compra, no " + estName(days[1].n[0].est) : "em " + days[1].n.length + " compras"}.`,
      "Ver nota",
      "open",
      days[1].n[0].id,
    ]);
  const kp = (l, v, s, h) =>
    `<div class="card kpi ${h ? "hl" : ""}"><div class="mono lab">${l}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  return `<div class="row mt">${kp("Total do período", brl(tot), `${new Set(items(r).map((i) => i.n.est)).size} estabelecimentos · ${lab()}`, 1)}${kp("Contra " + pl, delta(tot, pt), pt ? "anterior: " + brl(pt) : "sem dados anteriores")}${kp("Compras registradas", nn, pn ? (nn >= pn ? "▲ " + (nn - pn) + " a mais" : "▼ " + (pn - nn) + " a menos") + " que em " + pl : "—")}${kp("Valor médio por compra", brl(avg), pavg ? delta(avg, pavg) + " contra " + pl : "—")}</div>
<div class="row mt" style="align-items:stretch"><div class="card" style="width:640px;flex:none"><div style="display:flex;justify-content:space-between;gap:12px"><div><div class="mono lab">Evolução de gastos</div><div class="lab" style="font-size:13px;margin-top:8px;font-family:'Instrument Sans'">Cada ponto é um dia com compra · valores em R$</div></div><div class="tog"><span class="${F.line == "dia" ? "on" : ""}" data-a="line" data-v="dia">Por dia</span><span class="${F.line != "dia" ? "on" : ""}" data-a="line" data-v="acum">Soma acumulada</span></div></div>${lineChart()}</div>
<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:26px"><div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:10px"><div class="mono lab">Total por estabelecimento</div><div class="tog"><span class="${F.bar == "total" ? "on" : ""}" data-a="bar" data-v="total">Total</span><span class="${F.bar != "total" ? "on" : ""}" data-a="bar" data-v="media">Média por compra</span></div></div>
<div class="scr" style="max-height:${bars.length > 3 ? 330 : "none"}px;padding-right:12px">${
    bars
      .map((b) => {
        const x = b[F.bar == "total" ? "t" : "m"];
        return `<div class="hov" data-a="est" data-v="${F.est == b.e.id ? "" : b.e.id}" style="margin-bottom:20px;opacity:${F.est && F.est != b.e.id ? 0.45 : 1}"><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:15px">${b.e.name}</b><span class="serif" style="font-weight:600;font-size:19px">${brl(x)}</span></div><div style="height:16px;border-radius:8px;background:#e5e1d0;margin-top:8px"><div style="height:16px;border-radius:8px;width:${(x / bm) * 100}%;background:var(--g)"></div></div><div class="lab" style="font-size:12px;margin-top:7px">${b.n} compra${b.n > 1 ? "s" : ""} ${phrase()} · ${brl(b.m)} por compra</div></div>`;
      })
      .join("") || '<div class="lab">Sem compras no período.</div>'
  }</div></div>
<div class="card" style="flex:1"><div class="mono lab" style="margin-bottom:8px">Consumo por categoria alimentar</div>${catD.length ? `<div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap"><div style="flex:none">${donut(catD, cTot)}</div><div style="flex:1;min-width:200px">${catD.map((c) => `<div class="hov" data-a="cat" data-v="${F.cat == c[0] ? "" : c[0]}" style="display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid var(--line)"><i class="dot" style="background:${col(c[0])}"></i><span style="flex:1;font-weight:500">${c[0]}</span><b style="width:42px">${pct((c[1] / cTot) * 100)}</b><span class="lab" style="width:88px;text-align:right">${brl(c[1])}</span></div>`).join("")}</div></div>` : '<div class="lab">Sem dados.</div>'}</div></div></div>
<div class="card mt"><div class="mono lab" style="margin-bottom:20px">O que chamou atenção · ${lab()}</div><div class="row" style="gap:36px">${ins.map((i) => `<div class="ins"><i class="dot" style="background:${i[0]}"></i><p>${i[1]}<small data-a="${i[3]}" data-v="${esc(i[4])}">${i[2]}</small></p></div>`).join("") || '<span class="lab">Cadastre notas para ver destaques.</span>'}</div></div>`;
}
function det(tot, r, notes) {
  const all = items(r, { est: "" }),
    map = {};
  all.forEach((i) => {
    const k = i.name + " (" + i.unit + ")";
    (map[k] = map[k] || {})[i.n.est] =
      map[k][i.n.est] && map[k][i.n.est].d > i.n.date
        ? map[k][i.n.est]
        : { p: i.unitPrice, d: i.n.date };
  });
  const used = EST.filter((e) => Object.values(map).some((m) => m[e.id])),
    rows = Object.entries(map)
      .filter(([k, m]) => Object.keys(m).length > 1)
      .sort();
  const win = {};
  const trs = rows
    .map(([k, m]) => {
      const ks = Object.keys(m),
        lo = Math.min(...ks.map((x) => m[x].p)),
        best = ks.find((x) => m[x].p == lo),
        avg = sum(ks.map((x) => m[x].p)) / ks.length;
      win[best] = (win[best] || 0) + 1;
      return `<tr><td class="stl"><b style="font-weight:500">${esc(k)}</b></td>${used.map((e) => `<td class="r">${m[e.id] ? (m[e.id].p == lo ? `<span class="good">${brl(lo)}</span>` : brl(m[e.id].p)) : '<span class="lab">—</span>'}</td>`).join("")}<td class="str"><b style="color:var(--dg)">${estName(best)}</b><div class="lab" style="font-size:11.5px">${brl(avg - lo)} abaixo da média</div></td></tr>`;
    })
    .join("");
  const ws = Object.entries(win).sort((a, b) => b[1] - a[1]),
    zero = used.filter((e) => !win[e.id] && rows.some(([k, m]) => m[e.id]))[0],
    msg = ws.length
      ? `${estName(ws[0][0])} tem o menor preço em ${ws[0][1]} dos ${rows.length} itens${ws[1] ? " e " + estName(ws[1][0]) + " em " + ws[1][1] : ""}.${zero ? ` ${zero.name} não foi o mais barato em nenhum item${F.cat ? " de " + F.cat.toLowerCase() : ""}.` : ""}`
      : "";
  const ci = items(r),
    ct = sum(ci.map((i) => i.total)),
    pt = sum(items(prevRange(), {}).map((i) => i.total)),
    cn = [...new Set(ci.map((i) => i.n.id))],
    sp = {};
  ci.forEach((i) => (sp[i.n.est] = (sp[i.n.est] || 0) + i.total));
  const spl = Object.entries(sp).sort((a, b) => b[1] - a[1]),
    sh = ["#2E4429", "#4A6B3E", "#7E9A6B", "#B5C4A0"];
  return `<div class="row mt" style="align-items:stretch"><div class="card" style="width:740px;flex:none;min-width:0"><div class="mono lab">Mesmo item, preços diferentes${F.cat ? " · " + F.cat : ""}</div><div class="lab" style="font-size:13px;margin:8px 0 18px">Último preço pago no período · verde = menor preço · role para ver mais mercados e itens</div>
 ${rows.length ? `<div class="scr" style="max-height:382px;border:1px solid var(--line);border-radius:14px"><table style="min-width:${300 + used.length * 120}px"><thead><tr><th class="stl">Item</th>${used.map((e) => `<th class="r">${e.name.replace("Mercado ", "")}</th>`).join("")}<th class="str" style="background:#ece8d9">Melhor preço</th></tr></thead><tbody>${trs}</tbody></table></div>${msg ? `<div class="note">${msg}</div>` : ""}` : '<div class="empty">Nenhum item comprado em mais de um estabelecimento neste período.</div>'}</div>
 <div class="card" style="flex:1;min-width:0"><div class="mono lab">Resumo da seleção</div><div style="display:flex;gap:10px;align-items:center;margin-top:14px"><i class="dot" style="background:${F.cat ? col(F.cat) : "var(--dg)"}"></i><b>${F.cat || "Todas as categorias"}</b></div><div class="serif" style="font-weight:600;font-size:38px;margin-top:6px">${brl(ct)}</div><div class="lab" style="font-size:13px;margin-top:4px">${F.cat ? pct((ct / (sum(items(r, { cat: "" }).map((i) => i.total)) || 1)) * 100) + " do gasto do período · " : ""}${delta(ct, sum(items(prevRange()).map((i) => i.total)))} contra ${prevLab()}</div>
 <div style="display:flex;gap:26px;margin-top:22px;padding:16px 0;border-block:1px solid var(--line)">${[
   [ci.length, "itens"],
   [cn.length, "notas fiscais"],
   [brl(cn.length ? ct / cn.length : 0), "valor médio por nota"],
 ]
   .map(
     (a) =>
       `<div><div class="serif" style="font-weight:600;font-size:22px">${a[0]}</div><div class="lab" style="font-size:12px">${a[1]}</div></div>`,
   )
   .join("")}</div>
 <div class="lab" style="font-size:12.5px;margin:18px 0 10px">Onde foi comprado</div><div style="display:flex;border-radius:7px;overflow:hidden;gap:2px">${spl.map((s, i) => `<div style="width:${(s[1] / ct) * 100}%;background:${sh[i % 4]};height:14px"></div>`).join("")}</div>${spl.map((s, i) => `<div style="display:flex;gap:10px;align-items:center;margin-top:10px;font-size:13.5px"><i class="dot" style="background:${sh[i % 4]}"></i><span style="flex:1">${estName(s[0])}</span><b>${pct((s[1] / ct) * 100)}</b><span class="lab" style="width:88px;text-align:right">${brl(s[1])}</span></div>`).join("")}</div></div>
 <div class="card mt" style="display:flex;align-items:center;gap:16px;padding:20px 30px"><span style="color:var(--dg)">${ic("rcpt", 24)}</span><div style="flex:1;font-size:14.5px">${cn.length} notas fiscais deste período têm itens${F.cat ? " de " + F.cat.toLowerCase() : ""}. Veja cada nota e os itens comprados.</div><span class="sc" style="color:var(--dg);font-weight:500" data-go="notas">Ver em Notas fiscais</span></div>`;
}
