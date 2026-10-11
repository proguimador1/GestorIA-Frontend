"use strict";
P.inicio = () => {
  const d = dt(today());
  return (
    head(
      "Painel · " +
        d.getUTCDate() +
        " de " +
        MES[d.getUTCMonth()].toUpperCase(),
      `Oi, ${esc(S.user.name.split(" ")[0])}. <em class="serif" style="font-style:italic">O que vamos fazer hoje?</em>`,
    ) +
    `<div class="cards3">
<div class="act pri" data-go="cadastro">${ic("scan", 30)}<h3>Cadastrar itens</h3><p>Leia uma nota fiscal pela webcam ou registre manualmente.</p><div class="go mono">Abrir ${ic("up", 14)}</div></div>
<div class="act" data-go="financas">${ic("chart", 30)}<h3>Visualizar finanças</h3><p>Gastos por período, comparação entre mercados e planilhas.</p><div class="go mono">Abrir ${ic("up", 14)}</div></div>
<div class="act" data-go="chatbot"><span style="color:var(--red)">${ic("chat", 30)}</span><h3>Conversar com o GestorIA</h3><p>Converse com o agente — relatórios e dúvidas rápidas.</p><div class="go mono" style="color:var(--red)">Abrir ${ic("up", 14)}</div></div></div></div>`
  );
};
