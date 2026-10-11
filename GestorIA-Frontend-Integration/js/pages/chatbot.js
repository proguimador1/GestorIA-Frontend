"use strict";
// Chatbot interno: responde por consultas ao banco de notas (regras, sem IA generativa).
const SUG = [
  "Quanto gastei este mês?",
  "Quanto gastei esta semana?",
  "Gasto por categoria",
  "Onde gastei mais?",
  "Qual foi a última compra?",
  "Onde comprar tomate mais barato?",
];
const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
function chatRange(n) {
  if (/semana/.test(n)) return [range("week", today()), "esta semana"];
  if (/passad|anterior/.test(n)) {
    const m = range("month", today());
    return [range("month", add(m[0], -1)), "no mês passado"];
  }
  return [range("month", today()), "este mês"];
}
function chatAnswer(q) {
  const n = norm(q),
    [r, lb] = chatRange(n),
    ns = notesIn(r, { est: "" }),
    its = items(r, { cat: "", est: "" }),
    tot = sum(its.map((i) => i.total)),
    B = (x) => `<b>${x}</b>`;
  if (/ultim/.test(n)) {
    const l = [...S.notes].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    return l
      ? `A última nota é de ${B(dmy(l.date))} no ${B(estName(l.est))}: ${l.items.length} itens, ${B(brl(l.total))}.`
      : "Ainda não há notas cadastradas.";
  }
  const names = [
      ...new Set(S.notes.flatMap((x) => x.items.map((i) => i.name))),
    ],
    m =
      names.find((x) => n.includes(norm(x))) ||
      names.find((x) => n.includes(norm(x.split(" ")[0])));
  if (m && /barat|onde|preco|custa|caro/.test(n)) {
    const p = {};
    S.notes
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .forEach((x) =>
        x.items
          .filter((i) => i.name == m)
          .forEach((i) => (p[x.est] = i.unitPrice)),
      );
    const l = Object.entries(p).sort((a, b) => a[1] - b[1]);
    return l.length
      ? `${B(m)} — último preço em cada lugar: ${l.map((a) => estName(a[0]) + " " + brl(a[1])).join(" · ")}. O mais barato é ${B(estName(l[0][0]))}.`
      : "Não encontrei esse item.";
  }
  if (!ns.length) return `Não encontrei compras ${lb}.`;
  if (/categoria|tipo/.test(n)) {
    const c = {};
    its.forEach((i) => (c[i.cat] = (c[i.cat] || 0) + i.total));
    return (
      `Gasto por categoria ${lb}: ` +
      Object.entries(c)
        .sort((a, b) => b[1] - a[1])
        .map((a) => `${a[0]} ${B(brl(a[1]))} (${pct((a[1] / tot) * 100)})`)
        .join(" · ") +
      "."
    );
  }
  if (/onde|mercado|estabelec|loja/.test(n)) {
    const e = {};
    ns.forEach((x) => (e[x.est] = (e[x.est] || 0) + x.total));
    const l = Object.entries(e).sort((a, b) => b[1] - a[1]);
    return (
      `Você gastou mais no ${B(estName(l[0][0]))} ${lb}: ${B(brl(l[0][1]))}. ` +
      l
        .slice(1)
        .map((a) => estName(a[0]) + " " + brl(a[1]))
        .join(" · ")
    );
  }
  if (/caro|maior/.test(n)) {
    const d = Object.entries(byDay(r)).sort((a, b) => b[1].v - a[1].v)[0];
    return `O dia mais caro ${lb} foi ${B(dm(d[0]))}: ${B(brl(d[1].v))}.`;
  }
  if (/quant(a|o)s/.test(n) && /nota|compra/.test(n))
    return `Foram ${B(ns.length)} compras ${lb}, com ${B(sum(ns.map((x) => x.items.length)))} itens.`;
  if (/gast|total|paguei|custou/.test(n))
    return `Você gastou ${B(brl(tot))} ${lb}, em ${ns.length} compras (média de ${brl(tot / ns.length)} por compra).`;
  return "Ainda não entendi. Posso responder sobre: gasto total (semana ou mês), gasto por categoria, onde você gastou mais, última compra, dia mais caro e onde comprar um item mais barato.";
}
function sendChat(t) {
  chat.push({ from: "me", t: esc(t) }, { from: "bot", t: chatAnswer(t) });
}
P.chatbot = () =>
  head("Chatbot · GestorIA", "Pergunte sobre as suas compras") +
  `<div class="card mt" style="max-width:860px;padding:0;overflow:hidden"><div id="chatlog" class="scr chatlog">${chat.map((m) => `<div class="msg ${m.from}">${m.t}</div>`).join("")}</div>
<div class="chips">${SUG.map((s) => `<span class="chip" data-a="ask" data-v="${esc(s)}">${s}</span>`).join("")}</div>
<div class="chatin"><input id="chat-in" placeholder="Escreva sua pergunta…" autocomplete="off"><button class="btn dk" data-a="send">Enviar</button></div></div>`;
function chatBind() {
  const l = $("#chatlog"),
    i = $("#chat-in");
  l.scrollTop = l.scrollHeight;
  i.focus();
  i.onkeydown = (e) => {
    if (e.key == "Enter" && i.value.trim()) {
      sendChat(i.value.trim());
      render();
    }
  };
}
