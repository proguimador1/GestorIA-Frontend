"use strict";
// Exportação da planilha (.xlsx via SheetJS; CSV se a biblioteca não carregar).
function exportXlsx() {
  const R = sheetRows(),
    H = [
      "Data",
      "Estabelecimento",
      "Item",
      "Categoria",
      "Quantidade",
      "Unidade",
      "Preço unitário",
      "Total do item",
    ],
    [s, e] = range(),
    nm = `GestorIA_${F.mode == "month" ? s.slice(0, 7) : s + "_a_" + e}`;
  if (window.XLSX) {
    const ws = XLSX.utils.aoa_to_sheet([H, ...R]);
    const n = R.length + 1;
    ws["A" + (n + 1)] = { t: "s", v: "Total" };
    ws["H" + (n + 1)] = {
      t: "n",
      f: `SUM(H2:H${n})`,
      v: sum(R.map((r) => r[7])),
    };
    ws["!ref"] = `A1:H${n + 1}`;
    ws["!cols"] = [10, 20, 24, 14, 10, 8, 14, 14].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Itens");
    XLSX.writeFile(wb, nm + ".xlsx");
  } else {
    const csv =
        "\ufeff" +
        [H, ...R, ["Total", "", "", "", "", "", "", sum(R.map((r) => r[7]))]]
          .map((r) =>
            r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"),
          )
          .join("\n"),
      a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = nm + ".csv";
    a.click();
  }
  toast("Planilha gerada");
}
