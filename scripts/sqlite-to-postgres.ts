/**
 * Перенос данных из локального SQLite (prisma/database/dev.db) в PostgreSQL (domeo_production).
 * После запуска можно выполнить npm run sync:staging для выгрузки на ВМ.
 *
 * Запуск: npx tsx scripts/sqlite-to-postgres.ts
 * Требует: .env.postgresql с DATABASE_URL для PostgreSQL.
 */

import * as path from 'path';
import * as fs from 'fs';
const projectRoot = path.resolve(__dirname, '..');
const sqlitePath = path.join(projectRoot, 'prisma', 'database', 'dev.db');

function loadEnvPostgresql(): string {
  const envPath = path.join(projectRoot, '.env.postgresql');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.postgresql не найден. Создайте файл с DATABASE_URL="postgresql://user:pass@host:port/dbname"');
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const m = content.match(/DATABASE_URL="([^"]+)"/);
  if (!m) throw new Error('В .env.postgresql не найден DATABASE_URL');
  return m[1];
}

async function main() {
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`SQLite база не найдена: ${sqlitePath}`);
  }

  const pgUrl = loadEnvPostgresql();
  const Database = (await import('better-sqlite3')).default;
  const { Client } = await import('pg');

  const sqlite = new Database(sqlitePath, { readonly: true });
  const pg = new Client({ connectionString: pgUrl });

  const tablesRaw = sqlite.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name"
  ).all() as { name: string }[];

  const tables = tablesRaw.map((r) => r.name);
  const insertOrder = [
    'users', 'clients', 'catalog_categories', 'product_properties', 'category_property_assignments',
    'import_templates', 'constructor_configurations', 'documents', 'export_settings', 'frontend_categories',
    'constructor_configs', 'products', 'product_images', 'quotes', 'quote_items', 'invoices', 'invoice_items',
    'supplier_orders', 'import_history', 'system_settings', 'pages', 'page_elements', 'property_photos',
    'document_comments', 'document_history', 'notifications', 'orders'
  ];
  const orderedTables = insertOrder.filter((t) => tables.includes(t));
  const remainingTables = tables.filter((t) => !insertOrder.includes(t));
  const tablesToProcess = [...orderedTables, ...remainingTables];

  if (tables.length === 0) {
    console.log('В SQLite нет таблиц.');
    sqlite.close();
    await pg.end();
    return;
  }

  console.log('Подключение к PostgreSQL...');
  await pg.connect();

  // Порядок очистки: сначала таблицы, на которые ссылаются другие (листья первыми)
  const truncateOrder = [
    'document_comments', 'document_history', 'notifications', 'quote_items', 'invoice_items', 'orders',
    'product_images', 'page_elements', 'import_history', 'supplier_orders', 'quotes', 'invoices', 'documents',
    'export_settings', 'import_templates', 'category_property_assignments', 'products', 'property_photos',
    'constructor_configs', 'frontend_categories', 'constructor_configurations',
    'pages', 'system_settings', 'product_properties', 'catalog_categories', 'clients', 'users'
  ];
  const toTruncate = truncateOrder.filter((t) => tables.includes(t));
  console.log('Очистка таблиц в PostgreSQL...');
  for (const table of toTruncate) {
    try {
      await pg.query(`TRUNCATE "${table.replace(/"/g, '""')}" CASCADE`);
    } catch (e) {
      console.warn(`  TRUNCATE ${table}:`, (e as Error).message);
    }
  }
  const rest = tables.filter((t) => !toTruncate.includes(t));
  for (const table of rest) {
    try {
      await pg.query(`TRUNCATE "${table.replace(/"/g, '""')}" CASCADE`);
    } catch (e) {
      console.warn(`  TRUNCATE ${table}:`, (e as Error).message);
    }
  }

  let totalRows = 0;
  for (const table of tablesToProcess) {
    const info = sqlite.prepare(`PRAGMA table_info("${table.replace(/"/g, '""')}")`).all() as { name: string; type: string }[];
    const columns = info.map((c) => c.name);
    if (columns.length === 0) continue;

    const rows = sqlite.prepare(`SELECT * FROM "${table.replace(/"/g, '""')}"`).all() as Record<string, unknown>[];
    if (rows.length === 0) {
      console.log(`  ${table}: 0`);
      continue;
    }

    const cols = columns.map((c) => `"${c.replace(/"/g, '""')}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const qTable = `"${table.replace(/"/g, '""')}"`;
    const sql = `INSERT INTO ${qTable} (${cols}) VALUES (${placeholders})`;

    for (const row of rows) {
      const values = columns.map((col) => {
        const v = row[col];
        if (v === null || v === undefined) return null;
        if (typeof v === 'number' && Number.isInteger(v) && v > 1000000000000 && (col.includes('_at') || col.endsWith('At') || col === 'last_login' || col === 'valid_until' || col === 'invoice_date' || col === 'due_date' || col === 'order_date' || col === 'expected_date')) {
          return new Date(v).toISOString();
        }
        if (typeof v === 'number' && (col === 'is_active' || col === 'is_primary' || col === 'is_featured' || col === 'is_read' || col === 'is_published' || col.startsWith('is_'))) {
          return v === 1;
        }
        return v;
      });
      try {
        await pg.query(sql, values);
        totalRows += 1;
      } catch (e) {
        console.error(`  ${table} id=${String(row.id ?? row[columns[0]])}:`, (e as Error).message);
      }
    }
    console.log(`  ${table}: ${rows.length}`);
  }

  sqlite.close();
  await pg.end();
  console.log(`Готово. Перенесено строк: ${totalRows}. Дальше: npm run sync:staging`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
