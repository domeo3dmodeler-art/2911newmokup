/**
 * Строит resolved-urls.json по уже лежащим в public/uploads/final-filled/ файлам.
 * Используется когда фото скачали вручную с Яндекс.Диска (вариант B).
 *
 * Ожидаемая структура: public/uploads/final-filled/Наличники/, Цвет/, 04 Ручки Завертки/, 05 Ограничители/
 * Имена файлов должны совпадать с urlToRelPath из photo-entries.json (например nal_Прямой_70мм_cover.jpg).
 *
 * Запуск:
 *   npx tsx scripts/build-resolved-from-disk.ts
 * Затем:
 *   npm run bind:final-filled-from-json
 */
import * as path from 'path';
import * as fs from 'fs';

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'uploads', 'final-filled');
const ENTRIES_PATH = path.join(__dirname, 'photo-entries.json');
const RESOLVED_PATH = path.join(__dirname, 'resolved-urls.json');

function main() {
  if (!fs.existsSync(ENTRIES_PATH)) {
    console.error('Не найден', ENTRIES_PATH, '- сначала выполните: npm run collect:photo-entries');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf8'));
  const entries = Array.isArray(data.entries) ? data.entries : data;
  const urlToRelPath: Record<string, string> = data.urlToRelPath || {};

  const resolved: Record<string, string> = {};
  let found = 0;

  const tryResolveByAnyExtension = (relPath: string): string | null => {
    const direct = path.join(OUT_DIR, relPath);
    if (fs.existsSync(direct)) return relPath;

    const ext = path.extname(relPath);
    const noExtRel = ext ? relPath.slice(0, -ext.length) : relPath;
    const dirRel = path.dirname(noExtRel);
    const baseName = path.basename(noExtRel);
    const dirAbs = path.join(OUT_DIR, dirRel === '.' ? '' : dirRel);
    if (!fs.existsSync(dirAbs)) return null;

    const entriesInDir = fs.readdirSync(dirAbs, { withFileTypes: true });
    const lowerBase = baseName.toLowerCase();
    for (const item of entriesInDir) {
      if (!item.isFile()) continue;
      const itemBase = path.basename(item.name, path.extname(item.name)).toLowerCase();
      if (itemBase === lowerBase) {
        const joined = path.join(dirRel === '.' ? '' : dirRel, item.name).replace(/\\/g, '/');
        return joined;
      }
    }
    return null;
  };

  for (const e of entries) {
    const rel = urlToRelPath[e.url];
    if (!rel) continue;
    const resolvedRel = tryResolveByAnyExtension(rel);
    if (resolvedRel) {
      resolved[e.url] = '/uploads/final-filled/' + resolvedRel.replace(/\\/g, '/');
      found++;
    }
  }

  fs.writeFileSync(RESOLVED_PATH, JSON.stringify(resolved, null, 2), 'utf8');
  console.log('Записано', RESOLVED_PATH);
  console.log('Найдено файлов на диске:', found, 'из', entries.length);
  if (found > 0) {
    console.log('Дальше выполните: npm run bind:final-filled-from-json');
  } else {
    console.log('Положите фото в', OUT_DIR, 'по подпапкам Наличники, Цвет, 04 Ручки Завертки, 05 Ограничители с именами из Excel/photo-entries.');
  }
}

main();
