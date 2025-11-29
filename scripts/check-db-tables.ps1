# Script to check all tables in database
param()

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ПРОВЕРКА ВСЕХ ТАБЛИЦ В БАЗЕ ДАННЫХ" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$query = @"
SELECT 
    name as table_name,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as exists
FROM sqlite_master m
WHERE type='table' 
ORDER BY name;
"@

# Save query to temp file
$queryFile = "temp_query.sql"
$query | Out-File -FilePath $queryFile -Encoding UTF8

Write-Host "Список всех таблиц:" -ForegroundColor Yellow
Write-Host ""

# Try to use sqlite3 if available
if (Get-Command sqlite3 -ErrorAction SilentlyContinue) {
    sqlite3 prisma\dev.db ".tables" 2>&1 | ForEach-Object {
        $tableName = $_.Trim()
        if ($tableName) {
            Write-Host "  - $tableName" -ForegroundColor Gray
            $count = sqlite3 prisma\dev.db "SELECT COUNT(*) FROM [$tableName];" 2>&1
            if ($count -match '^\d+$') {
                Write-Host "    Записей: $count" -ForegroundColor Cyan
            }
        }
    }
} else {
    Write-Host "sqlite3 не установлен. Используем Node.js..." -ForegroundColor Yellow
    Write-Host ""
    
    # Create Node.js script
    $nodeScript = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.`$connect();
    
    // Get all tables
    const tables = await prisma.`$queryRaw\`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'
      ORDER BY name
    \`;
    
    console.log('Таблицы в базе данных:');
    console.log('');
    
    for (const table of tables) {
      const tableName = table.name;
      try {
        // Try to get count for each table
        const count = await prisma.`$queryRawUnsafe(\`SELECT COUNT(*) as count FROM \${tableName}\`);
        const recordCount = count[0]?.count || 0;
        console.log(\`  - \${tableName}: \${recordCount} записей\`);
      } catch (e) {
        console.log(\`  - \${tableName}: (ошибка при подсчете)\`);
      }
    }
    
    // Check specific important tables
    console.log('');
    console.log('Детальная информация:');
    console.log('');
    
    try {
      const usersCount = await prisma.user.count();
      console.log(\`  Пользователей: \${usersCount}\`);
    } catch (e) {}
    
    try {
      const clientsCount = await prisma.client.count();
      console.log(\`  Клиентов: \${clientsCount}\`);
    } catch (e) {}
    
    try {
      const productsCount = await prisma.product.count();
      console.log(\`  Продуктов: \${productsCount}\`);
    } catch (e) {}
    
    try {
      const categoriesCount = await prisma.catalogCategory.count();
      console.log(\`  Категорий: \${categoriesCount}\`);
    } catch (e) {}
    
    try {
      const ordersCount = await prisma.order.count();
      console.log(\`  Заказов: \${ordersCount}\`);
    } catch (e) {}
    
    try {
      const invoicesCount = await prisma.invoice.count();
      console.log(\`  Счетов: \${invoicesCount}\`);
    } catch (e) {}
    
    await prisma.`$disconnect();
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exit(1);
  }
})();
"@
    
    $nodeScriptFile = "temp_check_db.js"
    $nodeScript | Out-File -FilePath $nodeScriptFile -Encoding UTF8
    
    node $nodeScriptFile 2>&1
    
    Remove-Item -Path $nodeScriptFile -Force -ErrorAction SilentlyContinue
}

Remove-Item -Path $queryFile -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

