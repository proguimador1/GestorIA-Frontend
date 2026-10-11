"use strict";
// Gráficos em SVG: linha (com tooltip) e rosca.
function mono(p) {
  const n = p.length,
    x = p.map((a) => a[0]),
    y = p.map((a) => a[1]);
  if (n < 2) return `M${x[0]},${y[0]}`;
  const d = [];
  for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  const m = [d[0]];
  for (let i = 1; i < n - 1; i++)
    m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (!d[i]) {
      m[i] = m[i + 1] = 0;
    } else {
      const a = m[i] / d[i],
        b = m[i + 1] / d[i],
        s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[i] = t * a * d[i];
        m[i + 1] = t * b * d[i];
      }
    }
  }
  let s = `M${x[0]},${y[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = x[i + 1] - x[i];
    s += ` C${x[i] + h / 3},${y[i] + (m[i] * h) / 3} ${x[i + 1] - h / 3},${y[i + 1] - (m[i + 1] * h) / 3} ${x[i + 1]},${y[i + 1]}`;
  }
  return s;
}
let LP = [];
function lineChart() {
  const r = range(),
    m = byDay(r),
    days = Object.keys(m).sort(),
    W = 640,
    H = 400,
    L = 64,
    R = 16,
    T = 16,
    B = 36;
  if (!days.length)
    return `<div class="empty" style="margin-top:20px">Nenhuma compra neste período.<br>Que tal cadastrar uma nota?</div>`;
  let c = 0;
  const vals = days.map((d) => (F.line == "dia" ? m[d].v : (c += m[d].v))),
    max = Math.max(...vals),
    st = [50, 100, 200, 250, 500, 1000, 2000].find((s) => max / s <= 5) || 5000,
    top = Math.ceil(max / st) * st,
    span = (dt(r[1]) - dt(r[0])) / 864e5 || 1;
  const X = (d) => L + ((dt(d) - dt(r[0])) / 864e5 / span) * (W - L - R),
    Y = (v) => T + (1 - v / top) * (H - T - B);
  LP = days.map((d, i) => ({
    x: X(d),
    y: Y(vals[i]),
    d,
    v: vals[i],
    n: m[d].n,
  }));
  const g = [];
  for (let v = 0; v <= top; v += st)
    g.push(
      `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#d6d2c0" stroke-dasharray="3 5"/><text x="${L - 10}" y="${Y(v) + 4}" text-anchor="end" font-size="12" fill="#6B665A">${v ? "R$ " + v : 0}</text>`,
    );
  const k = Math.max(1, Math.ceil((span + 1) / 8)),
    xt = [];
  for (let i = 0; i <= span; i += k)
    xt.push(
      `<text x="${X(add(r[0], i))}" y="${H - 10}" text-anchor="middle" font-size="12" fill="#6B665A">${dm(add(r[0], i))}</text>`,
    );
  const p = mono(LP.map((a) => [a.x, a.y]));
  return `<svg id="lc" viewBox="0 0 ${W} ${H}" width="100%" style="margin-top:14px"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A6B3E" stop-opacity=".28"/><stop offset="1" stop-color="#4A6B3E" stop-opacity="0"/></linearGradient></defs>${g.join("")}${xt.join("")}<path d="${p} L${LP.at(-1).x},${Y(0)} L${LP[0].x},${Y(0)}Z" fill="url(#ga)"/><path d="${p}" fill="none" stroke="#2E4429" stroke-width="2.6"/>${LP.map((a) => `<circle cx="${a.x}" cy="${a.y}" r="4" fill="#F3EFE3" stroke="#2E4429" stroke-width="2"/>`).join("")}<g id="tp"></g><rect id="hit" x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>`;
}
function tip(i) {
  const a = LP[i];
  if (!a) return;
  const w = a.x > 400 ? -212 : 20,
    ex = [...new Set(a.n.map((n) => estName(n.est)))].join(", ");
  $("#tp").innerHTML =
    `<line x1="${a.x}" x2="${a.x}" y1="${a.y}" y2="364" stroke="#2E4429" stroke-dasharray="2 4"/><circle cx="${a.x}" cy="${a.y}" r="7" fill="#2E4429" stroke="#F3EFE3" stroke-width="3"/><g transform="translate(${a.x + w},${Math.max(4, a.y - 6)})"><rect width="192" height="74" rx="12" fill="#2E4429"/><text x="16" y="24" font-size="11.5" fill="#cfd8c0">${dm(a.d)}</text><text x="16" y="48" font-size="20" font-family="Fraunces,serif" font-weight="600" fill="#F3EFE3">${brl(a.v)}</text><text x="16" y="65" font-size="11.5" fill="#cfd8c0">${a.n.length} compra${a.n.length > 1 ? "s" : ""} · ${esc(ex.slice(0, 22))}</text></g>`;
}
function donut(data, tot) {
  let o = 0;
  const r = 70,
    C = 2 * Math.PI * r;
  return `<svg width="200" height="200" viewBox="0 0 200 200">${data
    .map(([c, v]) => {
      const p = v / tot,
        s = `<circle data-a="cat" data-v="${F.cat == c ? "" : c}" style="cursor:pointer;opacity:${F.cat && F.cat != c ? 0.35 : 1}" cx="100" cy="100" r="${r}" fill="none" stroke="${col(c)}" stroke-width="30" stroke-dasharray="${Math.max(0, C * p - 3)} ${C}" stroke-dashoffset="${-o}" transform="rotate(-90 100 100)"/>`;
      o += C * p;
      return s;
    })
    .join(
      "",
    )}<text x="100" y="94" text-anchor="middle" font-size="11.5" fill="#6B665A">Total</text><text x="100" y="118" text-anchor="middle" font-size="19" font-family="Fraunces,serif" font-weight="600">${brl(tot)}</text></svg>`;
}
