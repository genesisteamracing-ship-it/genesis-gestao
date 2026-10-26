/**
 * Utilitário para download de arquivo CSV compatível com Excel (UTF-8 com BOM)
 */
export function downloadCsvFile(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const escapeCsvCell = (cell: string | number): string => {
    const str = String(cell ?? "");
    if (str.includes(";") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCsvCell).join(";"),
    ...rows.map((row) => row.map(escapeCsvCell).join(";")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Aciona a visualização de impressão/exportação de Relatório PDF do Portfólio STEM Racing
 */
export function triggerPortfolioPdfPrint(): void {
  if (typeof window !== "undefined") {
    window.print();
  }
}
