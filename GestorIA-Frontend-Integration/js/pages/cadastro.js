"use strict";
// Cadastro: webcam / chave de acesso / manual. Uma nota por vez, com botão Confirmar.
function noteCard(n) {
  const e = EST.find((x) => x.id == n.est);
  return `<div class="ntc"><header><div><b style="font-size:17px">${esc(e.name)}</b><div class="lab" style="font-size:12px;margin-top:4px">CNPJ ${e.cnpj}</div></div><span class="lab">${dmy(n.date)}</span></header>${n.items.map((i, k) => `<div class="it"><span>${esc(i.name)}</span><span class="lab r">${i.qty} ${i.unit}</span><span class="r">${brl(i.total)}</span><span class="tag ${i.storage}" data-a="tag" data-v="${k}">${i.storage}</span><button class="x" data-a="rm" data-v="${k}">×</button></div>`).join("")}<div class="tot"><span class="lab">Total da nota</span><b>${brl(sum(n.items.map((i) => i.total)))}</b></div></div>`;
}
P.cadastro = () => {
  const left =
    cadTab == "webcam"
      ? `<div class="cam"><div class="lb mono"><i></i>Webcam ${window.camOn ? "ativa" : "inativa"}</div><video id="vid" autoplay muted playsinline></video><div class="fr"></div><div class="hint">Aponte o QR Code da nota fiscal para a webcam</div></div><button class="btn dk" style="margin-top:14px;width:100%;justify-content:center" data-a="scan">Simular leitura da nota</button>`
      : cadTab == "barra"
        ? `<div class="card"><div class="fld"><label class="lab mono">Chave de acesso (44 dígitos)</label><input id="chave" inputmode="numeric" maxlength="54" placeholder="0000 0000 0000 …"></div><button class="btn dk" style="margin-top:18px" data-a="chave">Buscar nota</button></div>`
        : `<div class="card"><div class="fld"><label class="lab mono">Estabelecimento</label><select class="f" id="m_est">${EST.map((e) => `<option value="${e.id}">${e.name}</option>`).join("")}</select></div><div class="fld" style="margin-top:14px"><label class="lab mono">Data da nota</label><input type="date" id="m_dt" value="${today()}"></div><hr style="margin:20px 0;border:0;border-top:1px solid var(--line)"><div class="fld"><label class="lab mono">Item</label><input id="m_nm" placeholder="Ex.: Leite integral"></div><div class="grid2" style="margin-top:14px"><div class="fld"><label class="lab mono">Quantidade</label><input id="m_q" type="number" step="0.1" value="1"></div><div class="fld"><label class="lab mono">Unidade</label><select class="f" id="m_u"><option>un</option><option>kg</option><option>g</option><option>L</option><option>ml</option></select></div></div><div class="fld" style="margin-top:14px"><label class="lab mono">Valor total (R$)</label><input id="m_v" type="number" step="0.01" placeholder="0,00"></div><button class="btn dk" style="margin-top:18px" data-a="madd">Adicionar item</button></div>`;
  return (
    head("Cadastro · Nota fiscal", "Escaneie a nota ou digite manualmente") +
    `<div class="fbar">${[
      ["webcam", "Webcam"],
      ["barra", "Código de barras"],
      ["manual", "Manual"],
    ]
      .map(
        (t) =>
          `<span class="seg ${cadTab == t[0] ? "on" : ""}" data-a="ctab" data-v="${t[0]}">${t[1]}</span>`,
      )
      .join("")}</div>
<div class="row mt"><div style="width:425px;flex:none">${left}</div><div style="flex:1;min-width:0">${draft ? noteCard(draft) + `<div style="display:flex;justify-content:flex-end;gap:12px;margin-top:18px"><button class="btn" style="background:transparent;color:var(--mute);border:1px solid #bfc4ae" data-a="discard">Descartar</button><button class="btn dk big" data-a="confirm" ${draft.items.length ? "" : "disabled"}>Confirmar itens</button></div>` : `<div class="empty">Nenhuma nota lida ainda.<br>Leia o QR Code, informe a chave de acesso ou digite os itens.<br><span class="mono" style="font-size:11px">Uma nota por vez</span></div>`}</div></div>`
  );
};
function readNote() {
  const u = SAMPLES.findIndex((s, i) => !S.used.includes(i));
  if (u < 0) {
    toast(
      "Todas as notas de demonstração já foram lidas. Restaure os dados em Configurações.",
    );
    return;
  }
  const s = SAMPLES[u];
  draft = {
    sample: u,
    est: s.est,
    nf: s.nf,
    date: s.date,
    items: s.items.map((i) => ({
      name: i[0],
      qty: i[1],
      unit: i[2],
      total: i[3],
      unitPrice: Math.round((i[3] / i[1]) * 100) / 100,
      cat: i[4],
      storage: i[5],
    })),
  };
  toast("Nota lida: " + draft.items.length + " itens");
  render();
}
async function startCam() {
  if (cadTab != "webcam" || window.camOn || !navigator.mediaDevices) return;
  try {
    const st = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    window.camOn = true;
    window.camSt = st;
    render();
    const v = $("#vid");
    if (v) {
      v.srcObject = st;
      if ("BarcodeDetector" in window) {
        const bd = new BarcodeDetector({ formats: ["qr_code"] });
        const tick = async () => {
          if (!window.camOn || !$("#vid")) return;
          try {
            const c = await bd.detect($("#vid"));
            if (c.length && !draft) {
              readNote();
              return;
            }
          } catch (e) {}
          setTimeout(tick, 600);
        };
        tick();
      }
    }
  } catch (e) {}
}
function stopCam() {
  window.camSt && window.camSt.getTracks().forEach((t) => t.stop());
  window.camOn = false;
}
function confirmNote() {
  const d = draft,
    t = sum(d.items.map((i) => i.total));
  S.notes.push({
    id: "n" + Date.now(),
    nf: d.nf,
    est: d.est,
    date: d.date,
    items: d.items,
    total: t,
  });
  if (d.sample !== undefined) S.used.push(d.sample);
  S.catalog += d.items.length;
  save();
  draft = null;
  const s = $("#sync");
  s.classList.add("busy");
  s.lastChild.textContent = "Sincronizando…";
  setTimeout(() => {
    s.classList.remove("busy");
    s.lastChild.textContent = "Sincronizado";
  }, 900);
  toast(`Nota registrada: ${d.items.length} itens · ${brl(t)}`);
  render();
}
