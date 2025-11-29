/**
 * Импорт реальных данных с тестовой ВМ через API
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STAGING_API_URL = 'http://130.193.40.35:3001';

// Данные для авторизации (нужно будет ввести)
let authToken = null;

async function login(email, password) {
  try {
    const response = await fetch(`${STAGING_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.token || data.data?.token;
  } catch (error) {
    console.error('Ошибка авторизации:', error.message);
    return null;
  }
}

async function fetchData(endpoint, token) {
  try {
    const response = await fetch(`${STAGING_API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`Ошибка при получении ${endpoint}:`, error.message);
    return null;
  }
}

async function importCategories(categoriesData) {
  console.log(`  Импорт ${categoriesData.length} категорий...`);
  
  for (const category of categoriesData) {
    try {
      await prisma.catalogCategory.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          parent_id: category.parent_id || null,
          level: category.level || 0,
          path: category.path || category.id,
          sort_order: category.sort_order || 0,
          is_active: category.is_active !== undefined ? category.is_active : true,
          products_count: category.products_count || 0
        },
        create: {
          id: category.id,
          name: category.name,
          parent_id: category.parent_id || null,
          level: category.level || 0,
          path: category.path || category.id,
          sort_order: category.sort_order || 0,
          is_active: category.is_active !== undefined ? category.is_active : true,
          products_count: category.products_count || 0
        }
      });
    } catch (error) {
      console.error(`    Ошибка при импорте категории ${category.id}:`, error.message);
    }
  }
  
  console.log(`  ✅ Импортировано категорий: ${categoriesData.length}`);
}

async function importClients(clientsData) {
  console.log(`  Импорт ${clientsData.length} клиентов...`);
  
  for (const client of clientsData) {
    try {
      await prisma.client.upsert({
        where: { id: client.id },
        update: {
          firstName: client.firstName,
          lastName: client.lastName,
          middleName: client.middleName,
          phone: client.phone,
          address: client.address,
          objectId: client.objectId || '',
          compilationLeadNumber: client.compilationLeadNumber || null,
          customFields: client.customFields || '{}',
          isActive: client.isActive !== undefined ? client.isActive : true
        },
        create: {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          middleName: client.middleName,
          phone: client.phone,
          address: client.address,
          objectId: client.objectId || '',
          compilationLeadNumber: client.compilationLeadNumber || null,
          customFields: client.customFields || '{}',
          isActive: client.isActive !== undefined ? client.isActive : true
        }
      });
    } catch (error) {
      console.error(`    Ошибка при импорте клиента ${client.id}:`, error.message);
    }
  }
  
  console.log(`  ✅ Импортировано клиентов: ${clientsData.length}`);
}

async function importProducts(productsData) {
  console.log(`  Импорт ${productsData.length} товаров...`);
  
  for (const product of productsData) {
    try {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          catalog_category_id: product.catalog_category_id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          brand: product.brand,
          model: product.model,
          series: product.series,
          base_price: product.base_price,
          currency: product.currency || 'RUB',
          stock_quantity: product.stock_quantity || 0,
          min_order_qty: product.min_order_qty || 1,
          weight: product.weight,
          dimensions: typeof product.dimensions === 'string' ? product.dimensions : JSON.stringify(product.dimensions || {}),
          specifications: typeof product.specifications === 'string' ? product.specifications : JSON.stringify(product.specifications || {}),
          properties_data: typeof product.properties_data === 'string' ? product.properties_data : JSON.stringify(product.properties_data || {}),
          tags: typeof product.tags === 'string' ? product.tags : JSON.stringify(product.tags || []),
          is_active: product.is_active !== undefined ? product.is_active : true,
          is_featured: product.is_featured || false
        },
        create: {
          id: product.id,
          catalog_category_id: product.catalog_category_id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          brand: product.brand,
          model: product.model,
          series: product.series,
          base_price: product.base_price,
          currency: product.currency || 'RUB',
          stock_quantity: product.stock_quantity || 0,
          min_order_qty: product.min_order_qty || 1,
          weight: product.weight,
          dimensions: typeof product.dimensions === 'string' ? product.dimensions : JSON.stringify(product.dimensions || {}),
          specifications: typeof product.specifications === 'string' ? product.specifications : JSON.stringify(product.specifications || {}),
          properties_data: typeof product.properties_data === 'string' ? product.properties_data : JSON.stringify(product.properties_data || {}),
          tags: typeof product.tags === 'string' ? product.tags : JSON.stringify(product.tags || []),
          is_active: product.is_active !== undefined ? product.is_active : true,
          is_featured: product.is_featured || false
        }
      });
    } catch (error) {
      console.error(`    Ошибка при импорте товара ${product.id}:`, error.message);
    }
  }
  
  console.log(`  ✅ Импортировано товаров: ${productsData.length}`);
}

async function importOrders(ordersData) {
  console.log(`  Импорт ${ordersData.length} заказов...`);
  
  for (const order of ordersData) {
    try {
      await prisma.order.upsert({
        where: { id: order.id },
        update: {
          number: order.number,
          client_id: order.client_id,
          invoice_id: order.invoice_id || null,
          lead_number: order.lead_number,
          complectator_id: order.complectator_id,
          executor_id: order.executor_id,
          status: order.status,
          project_file_url: order.project_file_url,
          door_dimensions: order.door_dimensions,
          measurement_done: order.measurement_done || false,
          project_complexity: order.project_complexity,
          wholesale_invoices: typeof order.wholesale_invoices === 'string' ? order.wholesale_invoices : (Array.isArray(order.wholesale_invoices) ? JSON.stringify(order.wholesale_invoices) : null),
          technical_specs: typeof order.technical_specs === 'string' ? order.technical_specs : (Array.isArray(order.technical_specs) ? JSON.stringify(order.technical_specs) : null),
          verification_status: order.verification_status,
          verification_notes: order.verification_notes,
          parent_document_id: order.parent_document_id || null,
          cart_session_id: order.cart_session_id || null,
          cart_data: typeof order.cart_data === 'string' ? order.cart_data : JSON.stringify(order.cart_data || null),
          total_amount: order.total_amount,
          notes: order.notes
        },
        create: {
          id: order.id,
          number: order.number,
          client_id: order.client_id,
          invoice_id: order.invoice_id || null,
          lead_number: order.lead_number,
          complectator_id: order.complectator_id,
          executor_id: order.executor_id,
          status: order.status || 'NEW_PLANNED',
          project_file_url: order.project_file_url,
          door_dimensions: order.door_dimensions,
          measurement_done: order.measurement_done || false,
          project_complexity: order.project_complexity,
          wholesale_invoices: typeof order.wholesale_invoices === 'string' ? order.wholesale_invoices : (Array.isArray(order.wholesale_invoices) ? JSON.stringify(order.wholesale_invoices) : null),
          technical_specs: typeof order.technical_specs === 'string' ? order.technical_specs : (Array.isArray(order.technical_specs) ? JSON.stringify(order.technical_specs) : null),
          verification_status: order.verification_status,
          verification_notes: order.verification_notes,
          parent_document_id: order.parent_document_id,
          cart_session_id: order.cart_session_id,
          cart_data: order.cart_data,
          total_amount: order.total_amount,
          notes: order.notes
        }
      });
    } catch (error) {
      console.error(`    Ошибка при импорте заказа ${order.id}:`, error.message);
    }
  }
  
  console.log(`  ✅ Импортировано заказов: ${ordersData.length}`);
}

async function main() {
  console.log('========================================');
  console.log('ИМПОРТ РЕАЛЬНЫХ ДАННЫХ С ТЕСТОВОЙ ВМ');
  console.log('========================================');
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Подключение к локальной БД установлено');
    console.log('');

    // Используем данные из переменных окружения или тестовые данные
    const email = process.env.STAGING_EMAIL || 'admin@domeo.ru';
    const password = process.env.STAGING_PASSWORD || 'admin123';
    
    console.log(`Используется email: ${email}`);
    console.log('');

    console.log('');
    console.log('Авторизация...');
    const token = await login(email, password);

    if (!token) {
      console.log('❌ Не удалось авторизоваться');
      console.log('');
      console.log('Альтернативные варианты:');
      console.log('1. Использовать прямое подключение к PostgreSQL через SSH туннель');
      console.log('2. Экспортировать данные вручную через API');
      await prisma.$disconnect();
      return;
    }

    console.log('✅ Авторизация успешна');
    console.log('');

    // Импортируем данные
    console.log('📥 Импорт данных...');
    console.log('');

    // Категории (сначала, т.к. товары ссылаются на них)
    console.log('0. Импорт категорий...');
    const categoriesData = await fetchData('/api/catalog/categories-flat', token);
    if (categoriesData && categoriesData.categories) {
      await importCategories(categoriesData.categories);
    } else {
      console.log('  ⚠️  Категории не получены');
    }
    console.log('');

    // Клиенты
    console.log('1. Импорт клиентов...');
    const clientsData = await fetchData('/api/clients', token);
    if (clientsData && clientsData.clients) {
      await importClients(clientsData.clients);
    } else {
      console.log('  ⚠️  Клиенты не получены');
    }
    console.log('');

    // Товары
    console.log('2. Импорт товаров...');
    const productsData = await fetchData('/api/catalog/products', token);
    if (productsData && productsData.products) {
      await importProducts(productsData.products);
    } else {
      console.log('  ⚠️  Товары не получены');
    }
    console.log('');

    // Заказы
    console.log('3. Импорт заказов...');
    const ordersData = await fetchData('/api/orders', token);
    if (ordersData && ordersData.orders) {
      await importOrders(ordersData.orders);
    } else {
      console.log('  ⚠️  Заказы не получены');
    }
    console.log('');

    // Итоги
    console.log('========================================');
    console.log('✅ ИМПОРТ ЗАВЕРШЕН');
    console.log('========================================');
    console.log('');

    const finalClients = await prisma.client.count();
    const finalProducts = await prisma.product.count();
    const finalOrders = await prisma.order.count();

    console.log('Итоговые данные в локальной БД:');
    console.log(`  Клиентов: ${finalClients}`);
    console.log(`  Товаров: ${finalProducts}`);
    console.log(`  Заказов: ${finalOrders}`);
    console.log('');

    await prisma.$disconnect();
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exit(1);
  }
}

main();

