/**
 * Полная синхронизация БД с тестовой ВМ
 * Экспортирует все данные с ВМ и импортирует в локальную БД
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs').promises;
const path = require('path');

const STAGING_API_URL = 'http://130.193.40.35:3001';
const STAGING_EMAIL = process.env.STAGING_EMAIL || 'admin@domeo.ru';
const STAGING_PASSWORD = process.env.STAGING_PASSWORD || 'admin123';

async function login() {
  try {
    console.log('Авторизация на тестовой ВМ...');
    const response = await fetch(`${STAGING_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: STAGING_EMAIL, password: STAGING_PASSWORD })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const token = data.token || data.data?.token;
    
    if (!token) {
      throw new Error('Token not received');
    }

    console.log('✅ Авторизация успешна');
    return token;
  } catch (error) {
    console.error('❌ Ошибка авторизации:', error.message);
    throw error;
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
      throw new Error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`❌ Ошибка при получении ${endpoint}:`, error.message);
    throw error;
  }
}

async function syncDatabase() {
  console.log('========================================');
  console.log('ПОЛНАЯ СИНХРОНИЗАЦИЯ БД С ТЕСТОВОЙ ВМ');
  console.log('========================================');
  console.log('');

  try {
    // 1. Авторизация
    const token = await login();
    console.log('');

    // 2. Подключение к локальной БД
    await prisma.$connect();
    console.log('✅ Подключение к локальной БД установлено');
    console.log('');

    // 3. Проверка текущего состояния
    console.log('Текущее состояние локальной БД:');
    const currentStats = {
      users: await prisma.user.count(),
      clients: await prisma.client.count(),
      orders: await prisma.order.count(),
      products: await prisma.product.count(),
      categories: await prisma.catalogCategory.count()
    };
    
    console.log(`  Пользователей: ${currentStats.users}`);
    console.log(`  Клиентов: ${currentStats.clients}`);
    console.log(`  Заказов: ${currentStats.orders}`);
    console.log(`  Товаров: ${currentStats.products}`);
    console.log(`  Категорий: ${currentStats.categories}`);
    console.log('');

    // 4. Экспорт данных с ВМ
    console.log('Экспорт данных с тестовой ВМ...');
    console.log('');

    // Категории
    console.log('  Загрузка категорий...');
    const categoriesResponse = await fetchData('/api/catalog/categories-flat', token);
    const categories = categoriesResponse?.categories || categoriesResponse || [];
    console.log(`    Получено категорий: ${categories.length}`);
    
    // Товары
    console.log('  Загрузка товаров...');
    const productsResponse = await fetchData('/api/catalog/products?limit=10000', token);
    const products = productsResponse?.products || productsResponse || [];
    console.log(`    Получено товаров: ${products.length}`);
    
    // Клиенты
    console.log('  Загрузка клиентов...');
    const clientsResponse = await fetchData('/api/clients', token);
    const clients = clientsResponse?.clients || clientsResponse || [];
    console.log(`    Получено клиентов: ${clients.length}`);
    
    // Заказы
    console.log('  Загрузка заказов...');
    const ordersResponse = await fetchData('/api/orders', token);
    const orders = ordersResponse?.orders || ordersResponse || [];
    console.log(`    Получено заказов: ${orders.length}`);
    console.log('');

    // 5. Очистка локальной БД (опционально)
    console.log('⚠️  ВНИМАНИЕ: Будет очищена локальная БД и импортированы данные с ВМ');
    console.log('   Для продолжения нажмите Ctrl+C, иначе через 5 секунд начнется импорт...');
    console.log('');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 6. Импорт данных
    console.log('Импорт данных в локальную БД...');
    console.log('');

    // Импорт категорий
    if (categories && categories.length > 0) {
      console.log(`  Импорт ${categories.length} категорий...`);
      
      for (const cat of categories) {
        try {
          await prisma.catalogCategory.upsert({
            where: { id: cat.id },
            update: {
              name: cat.name,
              parent_id: cat.parent_id || null,
              level: cat.level || 0,
              path: cat.path || cat.id || '',
              sort_order: cat.sort_order || 0,
              is_active: cat.is_active !== false,
              products_count: cat.product_count || cat.products_count || 0,
              updated_at: new Date()
            },
            create: {
              id: cat.id,
              name: cat.name,
              parent_id: cat.parent_id || null,
              level: cat.level || 0,
              path: cat.path || cat.id || '',
              sort_order: cat.sort_order || 0,
              is_active: cat.is_active !== false,
              products_count: cat.product_count || cat.products_count || 0
            }
          });
        } catch (error) {
          console.error(`    ⚠️  Ошибка импорта категории ${cat.name}:`, error.message);
        }
      }
      console.log(`  ✅ Импортировано категорий: ${categories.length}`);
    }

    // Импорт товаров
    if (products && products.length > 0) {
      console.log(`  Импорт ${products.length} товаров...`);
      
      let imported = 0;
      for (const prod of products) {
        try {
          // Преобразуем объекты в JSON строки
          const propertiesData = typeof prod.properties_data === 'string' 
            ? prod.properties_data 
            : JSON.stringify(prod.properties_data || {});
          
          const dimensions = typeof prod.dimensions === 'string'
            ? prod.dimensions
            : JSON.stringify(prod.dimensions || {});
          
          const specifications = typeof prod.specifications === 'string'
            ? prod.specifications
            : JSON.stringify(prod.specifications || {});
          
          const tags = typeof prod.tags === 'string'
            ? prod.tags
            : JSON.stringify(prod.tags || []);
          
          const wholesaleInvoices = typeof prod.wholesale_invoices === 'string'
            ? prod.wholesale_invoices
            : JSON.stringify(prod.wholesale_invoices || []);
          
          const technicalSpecs = typeof prod.technical_specs === 'string'
            ? prod.technical_specs
            : JSON.stringify(prod.technical_specs || {});
          
          const cartData = typeof prod.cart_data === 'string'
            ? prod.cart_data
            : JSON.stringify(prod.cart_data || {});

          // Извлекаем base_price из properties_data или используем значение из prod
          let basePrice = prod.base_price || 0;
          if (!basePrice && propertiesData) {
            try {
              const props = typeof propertiesData === 'string' ? JSON.parse(propertiesData) : propertiesData;
              // Пытаемся найти цену в разных полях
              basePrice = parseFloat(props['Цена розница'] || props['Цена опт'] || props['Domeo_цена группы Web'] || 0);
            } catch (e) {
              basePrice = 0;
            }
          }

          await prisma.product.upsert({
            where: { id: prod.id },
            update: {
              name: prod.name,
              sku: prod.sku,
              catalog_category_id: prod.catalog_category_id,
              base_price: basePrice,
              currency: prod.currency || 'RUB',
              properties_data: propertiesData,
              dimensions: dimensions,
              specifications: specifications,
              tags: tags,
              is_active: prod.is_active !== false,
              updated_at: new Date()
            },
            create: {
              id: prod.id,
              name: prod.name,
              sku: prod.sku,
              catalog_category_id: prod.catalog_category_id,
              base_price: basePrice,
              currency: prod.currency || 'RUB',
              properties_data: propertiesData,
              dimensions: dimensions,
              specifications: specifications,
              tags: tags,
              is_active: prod.is_active !== false
            }
          });
          imported++;
        } catch (error) {
          console.error(`    ⚠️  Ошибка импорта товара ${prod.name}:`, error.message);
        }
      }
      console.log(`  ✅ Импортировано товаров: ${imported}/${products.length}`);
    }

    // Импорт клиентов
    if (clients && clients.length > 0) {
      console.log(`  Импорт ${clients.length} клиентов...`);
      
      for (const client of clients) {
        try {
          await prisma.client.upsert({
            where: { id: client.id },
            update: {
              firstName: client.firstName,
              lastName: client.lastName,
              middleName: client.middleName || null,
              phone: client.phone,
              address: client.address,
              objectId: client.objectId,
              compilationLeadNumber: client.compilationLeadNumber || null,
              customFields: typeof client.customFields === 'string' 
                ? client.customFields 
                : JSON.stringify(client.customFields || {}),
              isActive: client.isActive !== false,
              updatedAt: new Date()
            },
            create: {
              id: client.id,
              firstName: client.firstName,
              lastName: client.lastName,
              middleName: client.middleName || null,
              phone: client.phone,
              address: client.address,
              objectId: client.objectId,
              compilationLeadNumber: client.compilationLeadNumber || null,
              customFields: typeof client.customFields === 'string' 
                ? client.customFields 
                : JSON.stringify(client.customFields || {}),
              isActive: client.isActive !== false
            }
          });
        } catch (error) {
          console.error(`    ⚠️  Ошибка импорта клиента ${client.firstName}:`, error.message);
        }
      }
      console.log(`  ✅ Импортировано клиентов: ${clients.length}`);
    }

    // Импорт заказов
    if (orders && orders.length > 0) {
      console.log(`  Импорт ${orders.length} заказов...`);
      
      for (const order of orders) {
        try {
          const cartData = typeof order.cart_data === 'string'
            ? order.cart_data
            : JSON.stringify(order.cart_data || {});
          
          const wholesaleInvoices = typeof order.wholesale_invoices === 'string'
            ? order.wholesale_invoices
            : JSON.stringify(order.wholesale_invoices || []);
          
          const technicalSpecs = typeof order.technical_specs === 'string'
            ? order.technical_specs
            : JSON.stringify(order.technical_specs || {});

          await prisma.order.upsert({
            where: { id: order.id },
            update: {
              number: order.number,
              client_id: order.client_id || null,
              invoice_id: order.invoice_id || null,
              lead_number: order.lead_number || null,
              complectator_id: order.complectator_id || null,
              executor_id: order.executor_id || null,
              status: order.status,
              project_file_url: order.project_file_url || null,
              door_dimensions: order.door_dimensions || null,
              measurement_done: order.measurement_done || false,
              project_complexity: order.project_complexity || null,
              wholesale_invoices: wholesaleInvoices,
              technical_specs: technicalSpecs,
              verification_status: order.verification_status || null,
              verification_notes: order.verification_notes || null,
              notes: order.notes || null,
              cart_data: cartData,
              total_amount: order.total_amount || 0,
              updated_at: new Date()
            },
            create: {
              id: order.id,
              number: order.number,
              client_id: order.client_id || null,
              invoice_id: order.invoice_id || null,
              lead_number: order.lead_number || null,
              complectator_id: order.complectator_id || null,
              executor_id: order.executor_id || null,
              status: order.status,
              project_file_url: order.project_file_url || null,
              door_dimensions: order.door_dimensions || null,
              measurement_done: order.measurement_done || false,
              project_complexity: order.project_complexity || null,
              wholesale_invoices: wholesaleInvoices,
              technical_specs: technicalSpecs,
              verification_status: order.verification_status || null,
              verification_notes: order.verification_notes || null,
              notes: order.notes || null,
              cart_data: cartData,
              total_amount: order.total_amount || 0
            }
          });
        } catch (error) {
          console.error(`    ⚠️  Ошибка импорта заказа ${order.number}:`, error.message);
        }
      }
      console.log(`  ✅ Импортировано заказов: ${orders.length}`);
    }

    console.log('');
    console.log('========================================');
    console.log('СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА');
    console.log('========================================');
    console.log('');

    // Финальная статистика
    const finalStats = {
      users: await prisma.user.count(),
      clients: await prisma.client.count(),
      orders: await prisma.order.count(),
      products: await prisma.product.count(),
      categories: await prisma.catalogCategory.count()
    };

    console.log('Итоговое состояние локальной БД:');
    console.log(`  Пользователей: ${finalStats.users}`);
    console.log(`  Клиентов: ${finalStats.clients}`);
    console.log(`  Заказов: ${finalStats.orders}`);
    console.log(`  Товаров: ${finalStats.products}`);
    console.log(`  Категорий: ${finalStats.categories}`);
    console.log('');

    await prisma.$disconnect();
    console.log('✅ Синхронизация завершена успешно!');

  } catch (error) {
    console.error('❌ Ошибка синхронизации:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

syncDatabase();

