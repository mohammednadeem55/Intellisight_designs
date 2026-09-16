import * as XLSX from "xlsx";

// Shared "export the table to Excel" action — a real .xlsx workbook (not CSV), used by Order Listing and
// Order Details' Hold Listing. XLSX.writeFile handles the browser download itself (creates the file and
// triggers the save), so there's no manual Blob/anchor-element plumbing needed here.
export function exportRowsToExcel(filename: string, headers: string[], rows: (string | number)[][], sheetName = "Sheet1") {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
