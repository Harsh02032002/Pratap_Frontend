/**
 * Roomhy – Client-side CSV & Excel export utility
 * Usage: exportToCSV('tenants.csv', ['Name','Phone'], [['Rahul','9999999999']])
 */

/**
 * Export data to a CSV file (triggers browser download)
 * @param {string} filename - e.g. 'tenants.csv'
 * @param {string[]} headers - column header labels
 * @param {(string|number)[][]} rows - 2D array of row values
 */
export function exportToCSV(filename, headers, rows) {
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    // RFC 4180: wrap in quotes if value contains comma, quote, or newline
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [headers, ...rows].map((row) => row.map(escape).join(','));
  const csvContent = '\uFEFF' + lines.join('\r\n'); // BOM for Excel UTF-8 compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format a date for CSV output (DD Mon YYYY)
 * @param {string|Date} d
 * @returns {string}
 */
export function csvDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Format currency for CSV (₹ sign omitted for spreadsheet compatibility)
 * @param {number|string} n
 * @returns {string}
 */
export function csvRupee(n) {
  return (Number(n) || 0).toString();
}
