/**
 * Создание дерева каталога для интеграции final_filled:
 * Корень "Каталог" + 5 категорий: Межкомнатные двери, Наличники, Комплекты фурнитуры, Ручки и завертки, Ограничители.
 * Если категория с таким именем уже есть — пропускаем. Выводит ID категорий в консоль и в scripts/catalog-tree-ids.json.
 *
 * Запуск: npx tsx scripts/seed-catalog-tree.ts
 */
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

const ROOT_NAME = 'Каталог';
const CHILDREN = [
  'Межкомнатные двери',
  'Наличники',
  'Комплекты фурнитуры',
  'Ручки и завертки',
  'Ограничители',
];

async function main() {
  const ids: Record<string, string> = {};

  // Найти или создать корень
  let root = await prisma.catalogCategory.findFirst({
    where: { name: ROOT_NAME, parent_id: null },
  });
  if (!root) {
    root = await prisma.catalogCategory.create({
      data: {
        name: ROOT_NAME,
        parent_id: null,
        level: 0,
        path: '',
        sort_order: 0,
      },
    });
    console.log('Создан корень:', root.name, root.id);
  } else {
    console.log('Корень уже есть:', root.name, root.id);
  }
  ids[ROOT_NAME] = root.id;

  for (let i = 0; i < CHILDREN.length; i++) {
    const name = CHILDREN[i];
    let cat = await prisma.catalogCategory.findFirst({
      where: { name, parent_id: root.id },
    });
    if (!cat) {
      const parentPath = root.path ? `${root.path}/${root.id}` : root.id;
      cat = await prisma.catalogCategory.create({
        data: {
          name,
          parent_id: root.id,
          level: 1,
          path: parentPath,
          sort_order: i + 1,
        },
      });
      console.log('Создана категория:', cat.name, cat.id);
    } else {
      console.log('Категория уже есть:', cat.name, cat.id);
    }
    ids[name] = cat.id;
  }

  const outPath = path.join(__dirname, 'catalog-tree-ids.json');
  fs.writeFileSync(outPath, JSON.stringify(ids, null, 2), 'utf8');
  console.log('\nID категорий сохранены в', outPath);
  console.log(JSON.stringify(ids, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
