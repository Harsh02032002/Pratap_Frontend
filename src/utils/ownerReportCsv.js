// Quote every cell and neutralize spreadsheet formulas in text fields.
export function buildOwnerReportCsv(data) {
  const cell = value => {
    let text = String(value ?? "");
    if (typeof value === "string" && (/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  if (!data.length) return '"No data found for the selected date range and filters"';
  const headers = Object.keys(data[0]);
  return [headers.map(cell).join(","), ...data.map(row => headers.map(h => cell(row[h])).join(","))].join("\r\n");
}
