#!/bin/bash
cd /opt/domeo
docker compose -f docker-compose.staging.yml exec -T staging-app curl -X POST http://localhost:3001/api/admin/products/rename-property -H "Content-Type: application/json" -d '{"categoryId":"cmg50xcgs001cv7mn0tdyk1wo","propertyName":"Тип покрытия","oldValue":"Нанотекс","newValue":"ПВХ"}'

