import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export interface ParsedExcelSheet {
  name: string;
  rowCount: number;
  columnHeaders: string[];
  rows: Record<string, any>[];
  formattedText: string;
}

export interface ParsedExcelDocument {
  fileName: string;
  sheetCount: number;
  sheets: ParsedExcelSheet[];
  fullTextForLLM: string;
}

export function parseExcelDocument(filePath: string): ParsedExcelDocument {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found at: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const fileName = path.basename(filePath);

  const parsedSheets: ParsedExcelSheet[] = [];
  let fullText = `=== EXCEL DOCUMENT: ${fileName} ===\n`;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    // Extract headers from first row if available
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const columnHeaders: string[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
      if (cell && cell.v !== undefined) {
        columnHeaders.push(String(cell.v).trim());
      }
    }

    let sheetText = `\n--- SHEET: "${sheetName}" (${jsonData.length} data rows) ---\n`;
    sheetText += `Columns: [${columnHeaders.join(' | ')}]\n\n`;

    jsonData.forEach((row, idx) => {
      const rowNum = idx + 2; // Row 1 is header
      const entries = Object.entries(row)
        .map(([k, v]) => `${k}: "${v}"`)
        .join(' | ');
      sheetText += `[Row ${rowNum}] ${entries}\n`;
    });

    fullText += sheetText;

    parsedSheets.push({
      name: sheetName,
      rowCount: jsonData.length,
      columnHeaders,
      rows: jsonData,
      formattedText: sheetText,
    });
  }

  return {
    fileName,
    sheetCount: parsedSheets.length,
    sheets: parsedSheets,
    fullTextForLLM: fullText,
  };
}
