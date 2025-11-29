const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCatalogTree() {
  try {
    await prisma.$connect();
    
    const DOORS_CATEGORY_ID = 'cmg50xcgs001cv7mn0tdyk1wo';
    const PARENT_CATEGORY_ID = 'cmg50xcgq0018v7mnwbtgmb69';
    
    // Проверяем родительскую категорию
    const parent = await prisma.catalogCategory.findUnique({
      where: { id: PARENT_CATEGORY_ID },
      include: {
        subcategories: {
          where: { is_active: true }
        }
      }
    });
    
    console.log('Родительская категория "Двери":');
    console.log(`  ID: ${parent?.id}`);
    console.log(`  Название: "${parent?.name}"`);
    console.log(`  Активна: ${parent?.is_active}`);
    console.log(`  Дочерних категорий (активных): ${parent?.subcategories.length}`);
    console.log('');
    
    if (parent?.subcategories) {
      console.log('Дочерние категории:');
      parent.subcategories.forEach(cat => {
        console.log(`  - "${cat.name}" (id: ${cat.id}, активна: ${cat.is_active}, товаров: ${cat.products_count || 0})`);
      });
      console.log('');
    }
    
    // Проверяем категорию дверей
    const doors = await prisma.catalogCategory.findUnique({
      where: { id: DOORS_CATEGORY_ID }
    });
    
    console.log('Категория "Межкомнатные двери":');
    console.log(`  ID: ${doors?.id}`);
    console.log(`  Название: "${doors?.name}"`);
    console.log(`  Активна: ${doors?.is_active}`);
    console.log(`  Родитель: ${doors?.parent_id}`);
    console.log(`  Родитель совпадает: ${doors?.parent_id === PARENT_CATEGORY_ID}`);
    console.log('');
    
    // Проверяем, что возвращает API
    const allCategories = await prisma.catalogCategory.findMany({
      where: { is_active: true },
      include: {
        _count: {
          select: {
            products: {
              where: { is_active: true }
            }
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { sort_order: 'asc' },
        { name: 'asc' }
      ]
    });
    
    console.log(`Всего активных категорий: ${allCategories.length}`);
    
    // Строим дерево как в API
    const categoriesWithCounts = allCategories.map(category => ({
      id: category.id,
      name: category.name,
      parent_id: category.parent_id,
      level: category.level,
      path: category.path,
      products_count: category._count.products
    }));
    
    const categoryMap = new Map();
    const rootCategories = [];
    
    categoriesWithCounts.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        children: []
      });
    });
    
    categoriesWithCounts.forEach(category => {
      const categoryNode = categoryMap.get(category.id);
      
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(categoryNode);
        } else {
          // Родитель не найден в активных категориях
          console.log(`⚠️  Категория "${category.name}" имеет неактивного родителя: ${category.parent_id}`);
          rootCategories.push(categoryNode);
        }
      } else {
        rootCategories.push(categoryNode);
      }
    });
    
    // Ищем категорию дверей в дереве
    function findCategory(nodes, targetId) {
      for (const node of nodes) {
        if (node.id === targetId) {
          return node;
        }
        if (node.children && node.children.length > 0) {
          const found = findCategory(node.children, targetId);
          if (found) return found;
        }
      }
      return null;
    }
    
    const doorsNode = findCategory(rootCategories, DOORS_CATEGORY_ID);
    
    if (doorsNode) {
      console.log('✅ Категория дверей найдена в дереве');
      console.log(`   Путь: ${doorsNode.path}`);
    } else {
      console.log('❌ Категория дверей НЕ найдена в дереве!');
    }
    
    // Проверяем родительскую категорию в дереве
    const parentNode = findCategory(rootCategories, PARENT_CATEGORY_ID);
    if (parentNode) {
      console.log('');
      console.log('Родительская категория "Двери" в дереве:');
      console.log(`   Дочерних категорий: ${parentNode.children.length}`);
      parentNode.children.forEach(child => {
        console.log(`     - "${child.name}" (id: ${child.id})`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exit(1);
  }
}

debugCatalogTree();

