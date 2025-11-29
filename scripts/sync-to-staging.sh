#!/bin/bash
# Скрипт синхронизации кода для Hot Reload на staging (Linux/Mac версия)
# Использование: ./scripts/sync-to-staging.sh [--watch] [--force]

STAGING_HOST="130.193.40.35"
STAGING_USER="ubuntu"
STAGING_PATH="/opt/domeo-staging"
LOCAL_PATH="."

# Пути для синхронизации
SYNC_PATHS=(
    "app"
    "components"
    "lib"
    "public"
    "prisma"
    "scripts"
    "package.json"
    "package-lock.json"
    "tsconfig.json"
    "tailwind.config.js"
    "next.config.mjs"
    "postcss.config.js"
)

WATCH=false
FORCE=false

# Парсинг аргументов
while [[ $# -gt 0 ]]; do
    case $1 in
        --watch)
            WATCH=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo "🔄 Синхронизация кода с staging ВМ..."
echo "   Host: $STAGING_HOST"
echo "   Path: $STAGING_PATH"
echo ""

# Проверка SSH подключения
echo "🔍 Проверка SSH подключения..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes $STAGING_USER@$STAGING_HOST "echo 'OK'" &>/dev/null; then
    echo "❌ Ошибка SSH подключения к $STAGING_HOST"
    echo "   Убедитесь что SSH ключ настроен"
    exit 1
fi

echo "✅ SSH подключение работает"
echo ""

# Создание директории на staging
echo "📁 Проверка директории на staging..."
ssh $STAGING_USER@$STAGING_HOST "mkdir -p $STAGING_PATH" &>/dev/null
echo "✅ Директория готова"
echo ""

# Функция синхронизации
sync_code() {
    echo "📤 Синхронизация файлов..."
    
    # Проверяем наличие rsync
    if ssh $STAGING_USER@$STAGING_HOST "which rsync" &>/dev/null; then
        echo "✅ Используем rsync (быстрее)"
        
        # Синхронизируем каждый путь
        for path in "${SYNC_PATHS[@]}"; do
            local_path="$LOCAL_PATH/$path"
            if [ -e "$local_path" ]; then
                echo "   → $path"
                rsync -avz --delete \
                    --exclude=node_modules \
                    --exclude=.next \
                    --exclude=.git \
                    --exclude=.env.local \
                    --exclude=*.log \
                    "$local_path" "$STAGING_USER@$STAGING_HOST:$STAGING_PATH/$path" &>/dev/null
            fi
        done
    else
        echo "⚠️  rsync не найден, используем scp"
        
        for path in "${SYNC_PATHS[@]}"; do
            local_path="$LOCAL_PATH/$path"
            if [ -e "$local_path" ]; then
                echo "   → $path"
                remote_dir=$(dirname "$path")
                ssh $STAGING_USER@$STAGING_HOST "mkdir -p $STAGING_PATH/$remote_dir" &>/dev/null
                scp -r "$local_path" "$STAGING_USER@$STAGING_HOST:$STAGING_PATH/$path" &>/dev/null
            fi
        done
    fi
    
    echo "✅ Синхронизация завершена"
    echo ""
}

# Функция перезапуска контейнера
restart_container() {
    echo "🔄 Перезапуск контейнера..."
    
    ssh $STAGING_USER@$STAGING_HOST "
        cd $STAGING_PATH
        docker compose -f docker-compose.staging-dev.yml restart staging-app
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Контейнер перезапущен"
    else
        echo "⚠️  Контейнер может быть не запущен, попробуйте запустить вручную"
    fi
    echo ""
}

# Основная логика
if [ "$WATCH" = true ]; then
    echo "👀 Режим наблюдения включен (Ctrl+C для остановки)"
    echo ""
    echo "💡 Используйте entr или inotify-tools для автоматической синхронизации"
    echo "   Пример: find . -type f | entr -r ./scripts/sync-to-staging.sh"
    echo ""
else
    sync_code
    
    if [ "$FORCE" = true ]; then
        restart_container
    else
        echo "💡 Для перезапуска контейнера используйте: ./scripts/sync-to-staging.sh --force"
    fi
fi

echo ""
echo "✅ Готово!"
echo "   Staging: http://130.193.40.35:3001"

