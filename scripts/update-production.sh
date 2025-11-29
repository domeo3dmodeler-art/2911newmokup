#!/bin/bash

# 🚀 Скрипт полного обновления production среды
# Использование: ./scripts/update-production.sh

set -e

echo "🔄 Начинаем обновление production среды..."
echo "📅 $(date)"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция логирования
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

# Проверка наличия необходимых файлов
check_files() {
    log "Проверяем наличие необходимых файлов..."
    
    if [ ! -f "docker-compose.production.yml" ]; then
        error "Файл docker-compose.production.yml не найден!"
    fi
    
    if [ ! -f "Dockerfile.production" ]; then
        error "Файл Dockerfile.production не найден!"
    fi
    
    if [ ! -f "package.json" ]; then
        error "Файл package.json не найден!"
    fi
    
    log "✅ Все необходимые файлы найдены"
}

# Создание бэкапа базы данных
backup_database() {
    log "Создаем бэкап базы данных..."
    
    BACKUP_DIR="backups"
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$BACKUP_DIR"
    
    # Если используется PostgreSQL
    if docker-compose -f docker-compose.production.yml ps db | grep -q "Up"; then
        docker-compose -f docker-compose.production.yml exec -T db pg_dump -U postgres domeo > "$BACKUP_FILE"
        log "✅ Бэкап создан: $BACKUP_FILE"
    else
        warning "База данных не запущена, пропускаем бэкап"
    fi
}

# Остановка сервисов
stop_services() {
    log "Останавливаем production сервисы..."
    docker-compose -f docker-compose.production.yml down
    log "✅ Сервисы остановлены"
}

# Обновление кода
update_code() {
    log "Обновляем код из репозитория..."
    
    if git status --porcelain | grep -q .; then
        warning "Обнаружены несохраненные изменения!"
        git status --short
        read -p "Продолжить? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Обновление отменено пользователем"
        fi
    fi
    
    git pull origin main
    log "✅ Код обновлен"
}

# Пересборка и запуск
rebuild_and_start() {
    log "Пересобираем и запускаем сервисы..."
    
    # Очистка старых образов
    docker system prune -f
    
    # Пересборка и запуск
    docker-compose -f docker-compose.production.yml up -d --build
    
    log "✅ Сервисы пересобраны и запущены"
}

# Проверка работоспособности
health_check() {
    log "Проверяем работоспособность сервисов..."
    
    # Ждем запуска сервисов
    sleep 10
    
    # Проверка основных endpoints
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
            log "✅ Health check пройден"
            break
        else
            log "Попытка $attempt/$max_attempts: сервис еще не готов..."
            sleep 5
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "Сервис не отвечает после $max_attempts попыток"
    fi
    
    # Дополнительные проверки
    curl -f -s http://localhost:3000/api/catalog/categories > /dev/null || error "Catalog API не отвечает"
    curl -f -s http://localhost:3000/api/catalog/products > /dev/null || error "Products API не отвечает"
    
    log "✅ Все проверки пройдены"
}

# Показать статус сервисов
show_status() {
    log "Статус сервисов:"
    docker-compose -f docker-compose.production.yml ps
    
    log "Использование ресурсов:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

# Основная функция
main() {
    log "🚀 Запуск обновления production среды"
    
    check_files
    backup_database
    stop_services
    update_code
    rebuild_and_start
    health_check
    show_status
    
    log "🎉 Обновление production среды завершено успешно!"
    log "🌐 Приложение доступно по адресу: http://localhost:3000"
}

# Обработка ошибок
trap 'error "Произошла ошибка в строке $LINENO"' ERR

# Запуск основной функции
main "$@"