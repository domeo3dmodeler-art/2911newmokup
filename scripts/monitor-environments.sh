#!/bin/bash

# 📊 Скрипт мониторинга обеих сред
# Использование: ./monitor-environments.sh

set -e

echo "📊 Мониторинг сред Domeo"
echo "========================="

# Настройки
PRODUCTION_HOST="130.193.40.35"
PRODUCTION_PORT="3000"
STAGING_HOST="130.193.40.35"
STAGING_PORT="3001"

# Функция проверки health check
check_health() {
    local host=$1
    local port=$2
    local env_name=$3
    
    echo "🔍 Проверяем $env_name ($host:$port)..."
    
    if curl -f -s "http://$host:$port/api/health" > /dev/null 2>&1; then
        echo "✅ $env_name: OK"
        return 0
    else
        echo "❌ $env_name: FAILED"
        return 1
    fi
}

# Функция проверки главной страницы
check_main_page() {
    local host=$1
    local port=$2
    local env_name=$3
    
    echo "🌐 Проверяем главную страницу $env_name..."
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$host:$port")
    
    if [ "$status_code" = "200" ]; then
        echo "✅ $env_name главная страница: OK ($status_code)"
        return 0
    else
        echo "❌ $env_name главная страница: FAILED ($status_code)"
        return 1
    fi
}

# Функция проверки времени ответа
check_response_time() {
    local host=$1
    local port=$2
    local env_name=$3
    
    echo "⏱️  Проверяем время ответа $env_name..."
    
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" "http://$host:$port/api/health")
    local response_time_ms=$(echo "$response_time * 1000" | bc)
    
    echo "📈 $env_name время ответа: ${response_time_ms}ms"
    
    # Проверяем, что время ответа меньше 2 секунд
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        echo "✅ $env_name время ответа: OK"
        return 0
    else
        echo "⚠️  $env_name время ответа: МЕДЛЕННО"
        return 1
    fi
}

# Основная проверка
echo ""
echo "🚀 Начинаем мониторинг..."
echo ""

# Проверяем Production
echo "=== PRODUCTION ==="
prod_health=0
prod_page=0
prod_time=0

check_health $PRODUCTION_HOST $PRODUCTION_PORT "Production" || prod_health=1
check_main_page $PRODUCTION_HOST $PRODUCTION_PORT "Production" || prod_page=1
check_response_time $PRODUCTION_HOST $PRODUCTION_PORT "Production" || prod_time=1

echo ""

# Проверяем Staging
echo "=== STAGING ==="
staging_health=0
staging_page=0
staging_time=0

check_health $STAGING_HOST $STAGING_PORT "Staging" || staging_health=1
check_main_page $STAGING_HOST $STAGING_PORT "Staging" || staging_page=1
check_response_time $STAGING_HOST $STAGING_PORT "Staging" || staging_time=1

echo ""

# Итоговый отчет
echo "📋 ИТОГОВЫЙ ОТЧЕТ"
echo "=================="

# Production статус
if [ $prod_health -eq 0 ] && [ $prod_page -eq 0 ] && [ $prod_time -eq 0 ]; then
    echo "✅ Production: ВСЕ ОК"
else
    echo "❌ Production: ПРОБЛЕМЫ"
    [ $prod_health -eq 1 ] && echo "   - Health check не работает"
    [ $prod_page -eq 1 ] && echo "   - Главная страница недоступна"
    [ $prod_time -eq 1 ] && echo "   - Медленный ответ"
fi

# Staging статус
if [ $staging_health -eq 0 ] && [ $staging_page -eq 0 ] && [ $staging_time -eq 0 ]; then
    echo "✅ Staging: ВСЕ ОК"
else
    echo "❌ Staging: ПРОБЛЕМЫ"
    [ $staging_health -eq 1 ] && echo "   - Health check не работает"
    [ $staging_page -eq 1 ] && echo "   - Главная страница недоступна"
    [ $staging_time -eq 1 ] && echo "   - Медленный ответ"
fi

echo ""

# Общий статус
total_errors=$((prod_health + prod_page + prod_time + staging_health + staging_page + staging_time))

if [ $total_errors -eq 0 ]; then
    echo "🎉 ВСЕ СИСТЕМЫ РАБОТАЮТ НОРМАЛЬНО!"
    exit 0
else
    echo "⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ ($total_errors ошибок)"
    exit 1
fi
