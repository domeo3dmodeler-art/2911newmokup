#!/bin/bash
# Скрипт синхронизации через Git для Hot Reload (Linux/Mac)
# Использование: ./scripts/git-sync-to-staging.sh [commit-message]

set -e

STAGING_HOST="130.193.40.35"
STAGING_USER="ubuntu"
STAGING_PATH="/opt/domeo"
BRANCH="develop"

# Параметры
COMMIT_MESSAGE="${1:-Auto-sync: $(date '+%Y-%m-%d %H:%M:%S')}"
NO_COMMIT="${NO_COMMIT:-false}"
NO_PUSH="${NO_PUSH:-false}"

echo ""
echo "========================================"
echo "🔄 СИНХРОНИЗАЦИЯ ЧЕРЕЗ GIT"
echo "========================================"
echo ""

# Проверка статуса git
echo "📊 Проверка статуса Git..."
if ! git status &>/dev/null; then
    echo "❌ Ошибка: это не git репозиторий"
    exit 1
fi

CHANGES=$(git status --short)
if [ -n "$CHANGES" ] && [ "$NO_COMMIT" != "true" ]; then
    echo "📝 Обнаружены изменения:"
    git status --short | sed 's/^/   /'
    echo ""
    
    # Добавляем все изменения
    echo "➕ Добавление изменений..."
    git add -A
    
    # Коммит
    echo "💾 Создание коммита..."
    git commit -m "$COMMIT_MESSAGE"
    
    echo "✅ Коммит создан: $COMMIT_MESSAGE"
else
    echo "ℹ️  Нет изменений для коммита"
fi

# Push на GitHub
if [ "$NO_PUSH" != "true" ]; then
    echo ""
    echo "📤 Отправка на GitHub ($BRANCH)..."
    git push origin "$BRANCH"
    
    if [ $? -eq 0 ]; then
        echo "✅ Код отправлен на GitHub"
    else
        echo "❌ Ошибка при отправке на GitHub"
        echo "   Попробуйте: git push origin $BRANCH"
        exit 1
    fi
else
    echo "ℹ️  Пропущена отправка на GitHub (NO_PUSH=true)"
fi

# Обновление на staging ВМ
echo ""
echo "🔄 Обновление кода на staging ВМ..."
echo "   Host: $STAGING_HOST"
echo "   Path: $STAGING_PATH"
echo "   Branch: $BRANCH"
echo ""

# Проверка SSH подключения
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$STAGING_USER@$STAGING_HOST" "echo 'OK'" &>/dev/null; then
    echo "❌ Ошибка SSH подключения к $STAGING_HOST"
    exit 1
fi

# Выполняем git pull на staging
echo "📥 Обновление кода на ВМ (git pull)..."
ssh "$STAGING_USER@$STAGING_HOST" "cd $STAGING_PATH && git fetch origin && git pull origin $BRANCH"

if [ $? -eq 0 ]; then
    echo "✅ Код обновлен на ВМ"
    
    # Перезапускаем контейнер для применения изменений
    echo ""
    echo "🔄 Перезапуск контейнера для применения изменений..."
    ssh "$STAGING_USER@$STAGING_HOST" "cd $STAGING_PATH && docker compose -f docker-compose.staging-dev.yml restart staging-app" || echo "⚠️  Ошибка при перезапуске контейнера"
else
    echo "❌ Ошибка при обновлении кода на ВМ"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА"
echo "========================================"
echo ""
echo "🌐 Staging URL: http://$STAGING_HOST:3001"
echo ""

