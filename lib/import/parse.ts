// app/lib/import/parse.ts
import * as XLSX from 'xlsx';

export type RawRow = Record<string, any>;

/** Parse XLSX or CSV file (by content) and return array of rows with raw headers preserved */
export async function parseAnyTable(file: File): Promise<RawRow[]> {
  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: RawRow[] = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as RawRow[];
  return rows;
}