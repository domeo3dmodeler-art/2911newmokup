/**
 * Скрипт для чтения шаблона из newdata.xlsx
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function readNewDataTemplate() {
  console.log('========================================');
  console.log('АНАЛИЗ ШАБЛОНА ИЗ NEWDATA.XLSX');
  console.log('========================================');
  console.log('');

  const filePath = path.join(__dirname, '..', 'newdata', 'newdata.xlsx');

  if (!fs.existsSync(filePath)) {
    console.error('❌ Файл newdata.xlsx не найден:', filePath);
    return;
  }

  try {
    console.log('Чтение файла:', filePath);
    const workbook = XLSX.readFile(filePath);
    
    console.log(`✅ Файл прочитан. Листов: ${workbook.SheetNames.length}`);
    console.log('');

    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`========================================`);
      console.log(`ЛИСТ ${index + 1}: ${sheetName}`);
      console.log('========================================');
      console.log('');

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: '',
        raw: false 
      });

      if (jsonData.length === 0) {
        console.log('  Лист пуст');
        console.log('');
        return;
      }

      // Первая строка - заголовки
      const headers = jsonData[0] || [];
      console.log(`  Строк данных: ${jsonData.length - 1}`);
      console.log(`  Колонок: ${headers.length}`);
      console.log('');

      if (headers.length > 0) {
        console.log('  Заголовки колонок:');
        headers.forEach((header, idx) => {
          if (header && String(header).trim()) {
            console.log(`    ${idx + 1}. ${String(header).trim()}`);
          }
        });
        console.log('');
      }

      // Показываем первые несколько строк данных
      if (jsonData.length > 1) {
        console.log('  Примеры данных (первые 3 строки):');
        const sampleRows = jsonData.slice(1, 4);
        sampleRows.forEach((row, rowIdx) => {
          console.log(`    Строка ${rowIdx + 1}:`);
          headers.forEach((header, colIdx) => {
            if (header && String(header).trim()) {
              const value = row[colIdx];
              if (value !== undefined && value !== null && String(value).trim()) {
                const displayValue = String(value).length > 50 
                  ? String(value).substring(0, 50) + '...' 
                  : String(value);
                console.log(`      ${String(header).trim()}: ${displayValue}`);
              }
            }
          });
          console.log('');
        });
      }

      // Анализ типов данных
      if (jsonData.length > 1) {
        console.log('  Анализ типов данных:');
        const dataRows = jsonData.slice(1);
        headers.forEach((header, colIdx) => {
          if (header && String(header).trim()) {
            const values = dataRows
              .map(row => row[colIdx])
              .filter(val => val !== undefined && val !== null && String(val).trim() !== '');
            
            if (values.length > 0) {
              const firstValue = String(values[0]);
              let type = 'string';
              
              if (!isNaN(Number(firstValue)) && firstValue.trim() !== '') {
                type = 'number';
              } else if (firstValue.toLowerCase() === 'true' || firstValue.toLowerCase() === 'false') {
                type = 'boolean';
              } else if (firstValue.startsWith('{') || firstValue.startsWith('[')) {
                type = 'json';
              }

              console.log(`    ${String(header).trim()}: ${type} (${values.length} значений)`);
            }
          }
        });
        console.log('');
      }
    });

    console.log('========================================');
    console.log('АНАЛИЗ ЗАВЕРШЕН');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Ошибка при чтении файла:', error.message);
    console.error(error.stack);
  }
}

readNewDataTemplate();

