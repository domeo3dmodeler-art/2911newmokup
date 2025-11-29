/**
 * Скрипт для автоматической защиты API endpoints
 * Добавляет аутентификацию к незащищенным API
 */

const fs = require('fs');
const path = require('path');

// Список API endpoints, которые должны быть защищены
const PROTECTED_ENDPOINTS = {
  // Административные API - требуют роль admin
  'admin': {
    protection: 'withAdminAuth',
    files: [
      'app/api/admin/stats/route.ts',
      'app/api/admin/products/route.ts',
      'app/api/admin/categories/route.ts',
      'app/api/admin/import/route.ts',
      'app/api/admin/users/route.ts',
      'app/api/admin/constructor-configs/route.ts',
      'app/api/admin/import-templates/route.ts',
      'app/api/admin/media/route.ts'
    ]
  },
  
  // API для менеджеров - требуют роль manager или выше
  'manager': {
    protection: 'withManagerAuth',
    files: [
      'app/api/complectator/stats/route.ts',
      'app/api/calculator/configs/route.ts',
      'app/api/configurator/route.ts',
      'app/api/export/route.ts',
      'app/api/documents/generate/route.ts'
    ]
  },
  
  // API для аутентифицированных пользователей
  'user': {
    protection: 'withUserAuth',
    files: [
      'app/api/clients/route.ts',
      'app/api/quotes/route.ts',
      'app/api/orders/route.ts',
      'app/api/invoices/route.ts',
      'app/api/cart/route.ts',
      'app/api/notifications/route.ts'
    ]
  },
  
  // API с опциональной аутентификацией
  'optional': {
    protection: 'withOptionalAuth',
    files: [
      'app/api/available-params/route.ts',
      'app/api/price/doors/route.ts',
      'app/api/catalog/products/route.ts',
      'app/api/catalog/categories/route.ts',
      'app/api/catalog/properties/route.ts'
    ]
  }
};

// Функция для добавления импорта аутентификации
function addAuthImport(content) {
  const importLine = "import { withOptionalAuth, AuthContext } from '../../../../lib/auth/api-protection';";
  
  // Проверяем, есть ли уже импорт аутентификации
  if (content.includes('from \'../../../../lib/auth/api-protection\'')) {
    return content;
  }
  
  // Находим последний импорт
  const importRegex = /import.*from.*['"];?\s*$/gm;
  const imports = content.match(importRegex);
  
  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertIndex = lastImportIndex + lastImport.length;
    
    return content.slice(0, insertIndex) + '\n' + importLine + content.slice(insertIndex);
  }
  
  // Если импортов нет, добавляем в начало
  return importLine + '\n' + content;
}

// Функция для защиты GET endpoint
function protectGETEndpoint(content, protection) {
  const getRegex = /export async function GET\(req: NextRequest\) \{/g;
  
  if (protection === 'withOptionalAuth') {
    return content.replace(getRegex, `export const GET = ${protection}(async (req: NextRequest, context: AuthContext | null) => {`);
  } else {
    return content.replace(getRegex, `export const GET = ${protection}(async (req: NextRequest, context: AuthContext) => {`);
  }
}

// Функция для защиты POST endpoint
function protectPOSTEndpoint(content, protection) {
  const postRegex = /export async function POST\(req: NextRequest\) \{/g;
  
  if (protection === 'withOptionalAuth') {
    return content.replace(postRegex, `export const POST = ${protection}(async (req: NextRequest, context: AuthContext | null) => {`);
  } else {
    return content.replace(postRegex, `export const POST = ${protection}(async (req: NextRequest, context: AuthContext) => {`);
  }
}

// Функция для защиты PUT endpoint
function protectPUTEndpoint(content, protection) {
  const putRegex = /export async function PUT\(req: NextRequest\) \{/g;
  
  if (protection === 'withOptionalAuth') {
    return content.replace(putRegex, `export const PUT = ${protection}(async (req: NextRequest, context: AuthContext | null) => {`);
  } else {
    return content.replace(putRegex, `export const PUT = ${protection}(async (req: NextRequest, context: AuthContext) => {`);
  }
}

// Функция для защиты DELETE endpoint
function protectDELETEEndpoint(content, protection) {
  const deleteRegex = /export async function DELETE\(req: NextRequest\) \{/g;
  
  if (protection === 'withOptionalAuth') {
    return content.replace(deleteRegex, `export const DELETE = ${protection}(async (req: NextRequest, context: AuthContext | null) => {`);
  } else {
    return content.replace(deleteRegex, `export const DELETE = ${protection}(async (req: NextRequest, context: AuthContext) => {`);
  }
}

// Функция для замены закрывающих скобок
function fixClosingBraces(content) {
  // Заменяем } на }); в конце функций
  return content.replace(/\}\s*$/gm, '});');
}

// Функция для добавления логирования аутентификации
function addAuthLogging(content, protection) {
  const loggingCode = `
  // Логируем информацию об аутентификации
  if (context) {
    console.log('🔐 Authenticated user:', context.userId, context.role);
  } else {
    console.log('🔓 Anonymous request');
  }
  `;
  
  if (protection === 'withOptionalAuth') {
    // Добавляем логирование после начала функции
    return content.replace(
      /(export const \w+ = \w+\(async \(req: NextRequest, context: AuthContext \| null\) => \{)/g,
      `$1${loggingCode}`
    );
  } else {
    // Добавляем логирование после начала функции
    return content.replace(
      /(export const \w+ = \w+\(async \(req: NextRequest, context: AuthContext\) => \{)/g,
      `$1${loggingCode}`
    );
  }
}

// Основная функция для защиты файла
function protectFile(filePath, protection) {
  try {
    console.log(`🔒 Protecting ${filePath} with ${protection}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Добавляем импорт аутентификации
    content = addAuthImport(content);
    
    // Защищаем все HTTP методы
    content = protectGETEndpoint(content, protection);
    content = protectPOSTEndpoint(content, protection);
    content = protectPUTEndpoint(content, protection);
    content = protectDELETEEndpoint(content, protection);
    
    // Добавляем логирование
    content = addAuthLogging(content, protection);
    
    // Исправляем закрывающие скобки
    content = fixClosingBraces(content);
    
    // Записываем обновленный файл
    fs.writeFileSync(filePath, content);
    
    console.log(`✅ Successfully protected ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error protecting ${filePath}:`, error.message);
  }
}

// Функция для проверки существования файла
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Основная функция
function protectAllEndpoints() {
  console.log('🚀 Starting API endpoints protection...\n');
  
  let totalProtected = 0;
  let totalSkipped = 0;
  
  for (const [level, config] of Object.entries(PROTECTED_ENDPOINTS)) {
    console.log(`📁 Processing ${level} level endpoints:`);
    
    for (const filePath of config.files) {
      if (fileExists(filePath)) {
        protectFile(filePath, config.protection);
        totalProtected++;
      } else {
        console.log(`⚠️ File not found: ${filePath}`);
        totalSkipped++;
      }
    }
    
    console.log('');
  }
  
  console.log('📊 Protection Summary:');
  console.log(`  ✅ Protected: ${totalProtected} files`);
  console.log(`  ⚠️ Skipped: ${totalSkipped} files`);
  console.log(`  📁 Total processed: ${totalProtected + totalSkipped} files`);
  
  console.log('\n💡 Next steps:');
  console.log('  1. Review the protected files for any issues');
  console.log('  2. Test the API endpoints with authentication');
  console.log('  3. Update frontend to include JWT tokens in requests');
  console.log('  4. Configure JWT_SECRET in environment variables');
  
  console.log('\n✅ API endpoints protection completed!');
}

// Запуск скрипта
if (require.main === module) {
  protectAllEndpoints();
}

module.exports = { protectAllEndpoints, protectFile };
