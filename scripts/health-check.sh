#!/bin/bash

# 🔍 Скрипт проверки работоспособности всех сервисов
# Использование: ./scripts/health-check.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Проверка доступности сервиса
check_service() {
    local url=$1
    local name=$2
    local timeout=${3:-10}
    
    info "Проверяем $name: $url"
    
    if curl -f -s --max-time $timeout "$url" > /dev/null 2>&1; then
        log "✅ $name - OK"
        return 0
    else
        error "❌ $name - FAILED"
        return 1
    fi
}

# Проверка Docker контейнеров
check_containers() {
    info "Проверяем статус Docker контейнеров..."
    
    if command -v docker-compose > /dev/null 2>&1; then
        if [ -f "docker-compose.production.yml" ]; then
            local containers=$(docker-compose -f docker-compose.production.yml ps -q)
            if [ -n "$containers" ]; then
                local running=$(docker-compose -f docker-compose.production.yml ps | grep -c "Up" || true)
                local total=$(docker-compose -f docker-compose.production.yml ps | grep -c "domeo" || true)
                
                if [ "$running" -eq "$total" ] && [ "$total" -gt 0 ]; then
                    log "✅ Все контейнеры запущены ($running/$total)"
                else
                    error "❌ Не все контейнеры запущены ($running/$total)"
                fi
            else
                warning "Контейнеры не найдены"
            fi
        else
            warning "docker-compose.production.yml не найден"
        fi
    else
        warning "docker-compose не установлен"
    fi
}

# Проверка использования ресурсов
check_resources() {
    info "Проверяем использование ресурсов..."
    
    if command -v docker > /dev/null 2>&1; then
        local cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" | head -1 | sed 's/%//')
        local mem_usage=$(docker stats --no-stream --format "{{.MemUsage}}" | head -1 | cut -d'/' -f1 | sed 's/MiB//')
        
        if [ -n "$cpu_usage" ] && [ -n "$mem_usage" ]; then
            log "📊 CPU: ${cpu_usage}%, Memory: ${mem_usage}MB"
            
            # Проверка критических значений
            if (( $(echo "$cpu_usage > 90" | bc -l) )); then
                warning "⚠️ Высокое использование CPU: ${cpu_usage}%"
            fi
            
            if (( $(echo "$mem_usage > 1000" | bc -l) )); then
                warning "⚠️ Высокое использование памяти: ${mem_usage}MB"
            fi
        fi
    else
        warning "Docker не установлен"
    fi
}

# Проверка базы данных
check_database() {
    info "Проверяем подключение к базе данных..."
    
    if [ -f "package.json" ] && grep -q "prisma" package.json; then
        if command -v npm > /dev/null 2>&1; then
            if npm run prisma:db:status > /dev/null 2>&1; then
                log "✅ База данных подключена"
            else
                error "❌ Проблемы с подключением к базе данных"
            fi
        else
            warning "npm не установлен"
        fi
    else
        warning "Prisma не настроен"
    fi
}

# Проверка основных API endpoints
check_api_endpoints() {
    info "Проверяем основные API endpoints..."
    
    local base_url="http://localhost:3000"
    local endpoints=(
        "/api/health:Health API"
        "/api/catalog/categories:Catalog API"
        "/api/catalog/products:Products API"
        "/api/users:Users API"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local url=$(echo $endpoint | cut -d':' -f1)
        local name=$(echo $endpoint | cut -d':' -f2)
        check_service "${base_url}${url}" "$name" 5
    done
}

# Проверка веб-интерфейса
check_web_interface() {
    info "Проверяем веб-интерфейс..."
    
    local pages=(
        "/:Главная страница"
        "/dashboard:Dashboard"
        "/catalog:Каталог"
    )
    
    for page in "${pages[@]}"; do
        local url=$(echo $page | cut -d':' -f1)
        local name=$(echo $page | cut -d':' -f2)
        check_service "http://localhost:3000${url}" "$name" 10
    done
}

# Проверка логов на ошибки
check_logs() {
    info "Проверяем логи на критические ошибки..."
    
    if command -v docker-compose > /dev/null 2>&1 && [ -f "docker-compose.production.yml" ]; then
        local error_count=$(docker-compose -f docker-compose.production.yml logs --tail=100 2>&1 | grep -i "error\|exception\|fatal" | wc -l)
        
        if [ "$error_count" -gt 0 ]; then
            warning "⚠️ Найдено $error_count ошибок в логах"
            docker-compose -f docker-compose.production.yml logs --tail=20 | grep -i "error\|exception\|fatal" || true
        else
            log "✅ Критических ошибок в логах не найдено"
        fi
    else
        warning "Не удалось проверить логи"
    fi
}

# Генерация отчета
generate_report() {
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    local report_file="health-report-$(date +%Y%m%d_%H%M%S).txt"
    
    info "Генерируем отчет: $report_file"
    
    {
        echo "=== ОТЧЕТ О РАБОТОСПОСОБНОСТИ СИСТЕМЫ ==="
        echo "Дата: $timestamp"
        echo "=========================================="
        echo
        
        echo "=== СТАТУС КОНТЕЙНЕРОВ ==="
        docker-compose -f docker-compose.production.yml ps 2>/dev/null || echo "Контейнеры не найдены"
        echo
        
        echo "=== ИСПОЛЬЗОВАНИЕ РЕСУРСОВ ==="
        docker stats --no-stream 2>/dev/null || echo "Статистика недоступна"
        echo
        
        echo "=== ПОСЛЕДНИЕ ЛОГИ ==="
        docker-compose -f docker-compose.production.yml logs --tail=50 2>/dev/null || echo "Логи недоступны"
        
    } > "$report_file"
    
    log "📄 Отчет сохранен: $report_file"
}

# Основная функция
main() {
    log "🔍 Запуск проверки работоспособности системы"
    echo
    
    check_containers
    echo
    
    check_resources
    echo
    
    check_database
    echo
    
    check_api_endpoints
    echo
    
    check_web_interface
    echo
    
    check_logs
    echo
    
    generate_report
    echo
    
    log "🎉 Все проверки завершены успешно!"
    log "🌐 Система работает корректно"
}

# Обработка ошибок
trap 'error "Произошла ошибка в строке $LINENO"' ERR

# Запуск основной функции
main "$@"
