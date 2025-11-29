#!/bin/bash
# Скрипт для переименования свойства "Нанотекс" на "ПВХ" в категории "Двери"

cd /opt/domeo

# Выполняем запрос через API
curl -X POST http://localhost:3001/api/admin/products/rename-property \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "cmg50xcgs001cv7mn0tdyk1wo",
    "propertyName": "Тип покрытия",
    "oldValue": "Нанотекс",
    "newValue": "ПВХ"
  }'

