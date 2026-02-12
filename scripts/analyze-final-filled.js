/**
 * Анализ структуры final_filled 30.01.xlsx — все вкладки
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', '1002', 'final_filled 30.01.xlsx');

if (!fs.existsSync(filePath)) {
  console.error('Файл не найден:', filePath);
  process.exit(1);
}

const workbook = XLSX.readFile(filePath, { cellDates: true, cellNF: false, cellText: false });
const output = {
  file: filePath,
  sheetNames: workbook.SheetNames,
  sheets: {}
};

workbook.SheetNames.forEach((sheetName) => {
  const ws = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
  const headers = (json[0] || []).map(h => (h != null ? String(h).trim() : ''));
  const rows = json.slice(1).filter(row => row.some(cell => cell != null && String(cell).trim() !== ''));
  const sampleRows = rows.slice(0, 5).map(row => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = row[i] != null ? String(row[i]).trim() : ''; });
    return obj;
  });
  output.sheets[sheetName] = {
    totalRows: rows.length,
    headers,
    sampleRows
  };
});

const outPath = path.join(__dirname, 'final-filled-analysis-utf8.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
console.log('Written to', outPath);
