import * as fs from 'fs';
import * as path from 'path';
const base = path.join(__dirname, '..', 'public', 'uploads', 'final-filled', 'Наличники');
const out: string[] = [];
if (fs.existsSync(base)) {
  const dirs = fs.readdirSync(base);
  for (const d of dirs) {
    const full = path.join(base, d);
    if (!fs.statSync(full).isDirectory()) continue;
    const files = fs.readdirSync(full);
    for (const f of files) {
      out.push(`${d}\t${f}`);
    }
  }
}
fs.writeFileSync(path.join(__dirname, 'nalichniki-list.txt'), out.join('\n'), 'utf8');
console.log('Written', out.length, 'lines to scripts/nalichniki-list.txt');
