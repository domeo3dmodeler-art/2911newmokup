/**
 * Вывести структуру final_filled 30.01.xlsx: листы и заголовки столбцов.
 * Запуск: npx tsx scripts/inspect-final-filled-xlsx.ts
 */
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const FILE_PATH = path.join(__dirname, '..', '1002', 'final_filled 30.01.xlsx');

function main() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error('Файл не найден:', FILE_PATH);
    process.exit(1);
  }
  const wb = XLSX.readFile(FILE_PATH, { raw: false });
  console.log('Листы:', wb.SheetNames);
  console.log('');
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { header: 1, defval: '' });
    const headers = (rows[0] as string[]) || [];
    console.log('---', name, '---');
    console.log('Столбцы:', headers.filter(Boolean).length);
    headers.forEach((h, i) => {
      if (h) console.log('  ', i + 1, h);
    });
    console.log('');
  }
}

main();
