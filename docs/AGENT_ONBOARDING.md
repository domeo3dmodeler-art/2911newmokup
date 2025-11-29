# Инфраструктура и текущее состояние проекта

> 📖 **Полная архитектура проекта**: См. [ARCHITECTURE.md](./ARCHITECTURE.md) для детального описания архитектуры, модулей, API и технических деталей.

> 📚 **Вся документация**: Полный список документов см. в [docs/README.md](./README.md)

## Облачная инфраструктура

- **Облако**: Yandex Cloud (ru-central1-b)
- **Kubernetes**: Managed K8s кластер `cat9eenl393qj44riti4`
- **Namespace**: `prod`
- **Ноды**: 158.160.27.112 (ubuntu)
- **Тестовая ВМ**: 130.193.40.35 (ubuntu)

## Публикация приложения

- **Service тип**: `LoadBalancer` (NLB)
- **VIP (External IP)**: `158.160.202.117:80` → `targetPort:3001`
- **Health-эндпоинт**: `http://158.160.202.117/api/health` (204) и `http://158.160.202.117/` (200)

## Текущее приложение (prod)

### Deployment `app`

- **Реплики**: 2
- **Контейнер**: `cr.yandex/crpuein3jvjccnafs2vc/app:v20251030202308`
- **Порт**: 3001
- **ENV переменные**:
  - `NODE_ENV=production`
  - `PORT=3001`
  - `DATABASE_URL=postgresql://staging_user:staging_password@postgres:5432/domeo_staging`
  - `JWT_SECRET` (из secret `app-secrets`)
- **Пробы**:
  - Readiness: HTTP GET `/api/health` на порт 3001, initialDelay: 5s, period: 10s
  - Liveness: HTTP GET `/api/health` на порт 3001, initialDelay: 15s, period: 20s

### Service `app`

- Тип: `LoadBalancer` с `externalTrafficPolicy: Cluster`
- Порт: `80 → targetPort:3001`

## База данных PostgreSQL

### Развертывание в K8s

- **StatefulSet**: `postgres`
- **Service**: `postgres:5432` (ClusterIP)
- **Образ**: `postgres:15-alpine`
- **Учетные данные**:
  - Пользователь: `staging_user`
  - Пароль: `staging_password`
  - База данных: `domeo_staging`
- **PVC**: автоматически создан для данных (10Gi)
- **PGDATA**: `/var/lib/postgresql/data/pgdata`

### ⚠️ ВАЖНО: База данных НЕ обновляется автоматически

- **Миграции в CI отключены** — база данных не меняется при деплоях
- **Изменения схемы** выполняются только вручную после бэкапа
- База восстановлена из тестовой ВМ и должна оставаться стабильной
- Приложение использует существующую схему БД

## Хранение фото (uploads)

### PVC для uploads

- **PVC**: `app-uploads` (5Gi, ReadWriteOnce)
- **Mount path**: `/app/public/uploads` в контейнере
- **Содержимое**: 575 файлов (~74MB) — все фото с тестовой ВМ
- **Структура**: `/app/public/uploads/products/{categoryId}/{filename}`

### Восстановление фото

- Все фото перенесены с тестовой ВМ `130.193.40.35`
- Резервная копия: `backup/uploads_backup.tar.gz` (75MB)
- Фото привязаны в БД через таблицу `property_photos` (photoPath)

## Регистр образов

- **Yandex Container Registry**: `cr.yandex/crpuein3jvjccnafs2vc`
- **Репозиторий образа**: `cr.yandex/crpuein3jvjccnafs2vc/app:<tag>`
- **Текущий тег в проде**: `v20251030202308`

## Структура репозитория / манифестов

### Kustomize структура

```
k8s/
├── base/
│   ├── deployment.yaml      # Deployment приложения
│   ├── service.yaml         # Service (LoadBalancer)
│   ├── postgres.yaml        # StatefulSet + Service для PostgreSQL
│   ├── uploads-pvc.yaml    # PVC для фото
│   ├── configmap.yaml
│   ├── secret.yaml          # JWT_SECRET (без DATABASE_URL)
│   └── kustomization.yaml
└── overlays/
    └── prod/
        └── kustomization.yaml  # Namespace prod, image tag v20251030202308
```

### Скрипты

- **Сборка/пуш образа**:
  - Linux/macOS: `./scripts/build_and_push.sh app <tag>`
  - Windows: `./scripts/build_and_push.ps1 -ImageName app -Tag <tag>`
  
- **Релиз в прод**: `./scripts/rollout.sh <tag>`
- **Откат**: `./scripts/rollback.sh`
- **Миграции БД**: `./scripts/run_db_migration.sh` (⚠️ НЕ используется автоматически)

### CI/CD

- **GitHub Actions**: `.github/workflows/prod-deploy.yml`
- **Триггеры**: 
  - Push в `main`
  - Ручной запуск (workflow_dispatch) с опциональным `image_tag`
- **Секреты**:
  - `YC_SA_KEY` — JSON ключ сервисного аккаунта
  - `IMAGE_REPO` — `cr.yandex/crpuein3jvjccnafs2vc/app`
  - Опционально: `YC_CLOUD_ID`, `YC_FOLDER_ID`

## Команды работы с кластером

### Подключение

```bash
yc managed-kubernetes cluster get-credentials --id cat9eenl393qj44riti4 --external --force
kubectl config use-context yc-domeo-prod
kubectl config set-context --current --namespace=prod
```

### Проверка статуса

```bash
# Приложение
kubectl -n prod get pods -l app=app
kubectl -n prod get svc app

# База данных
kubectl -n prod get pods -l app=postgres
kubectl -n prod exec -i postgres-0 -- sh -lc "export PGPASSWORD=staging_password; psql -U staging_user -d domeo_staging -c 'SELECT count(*) FROM pg_tables WHERE schemaname='\''public'\'';'"

# Фото
kubectl -n prod get pvc app-uploads
kubectl -n prod exec -i <app-pod> -- sh -lc "find /app/public/uploads -type f | wc -l"
```

### Деплой

```bash
# Синхронизация манифестов
kubectl apply -k k8s/overlays/prod

# Смена образа
kubectl -n prod set image deployment/app app=cr.yandex/crpuein3jvjccnafs2vc/app:<new-tag>
kubectl -n prod rollout status deploy/app

# Или через скрипт
./scripts/rollout.sh <tag>
```

### Откат

```bash
./scripts/rollback.sh
# или
kubectl -n prod rollout undo deploy/app
```

## Тестовая ВМ (130.193.40.35)

- **SSH ключ**: `C:\Users\petr2\.ssh\ssh-key-1757583003347\ssh-key-1757583003347`
- **Пользователь**: `ubuntu`
- **Postgres контейнер**: `domeo-staging-postgres`
  - Пользователь: `staging_user`
  - Пароль: `staging_password`
  - БД: `domeo_staging`
- **App контейнер**: `domeo-staging-app`
  - Фото: `/app/public/uploads`

## Резервные копии

### База данных

- **Локально**: `backup/prod_seed_clean.sql` (~8.5MB)
- **Создание нового дампа**:
  ```bash
  # На тестовой ВМ
  docker exec -e PGPASSWORD=staging_password domeo-staging-postgres sh -lc 'pg_dump -U staging_user -d domeo_staging -f /tmp/dump.sql'
  docker cp domeo-staging-postgres:/tmp/dump.sql /home/ubuntu/dump.sql
  # Скачать локально
  scp -i <key> ubuntu@130.193.40.35:/home/ubuntu/dump.sql ./backup/
  ```

### Фото

- **Локально**: `backup/uploads_backup.tar.gz` (~75MB)
- **Восстановление в прод**:
  ```bash
  kubectl -n prod cp ./backup/uploads_backup.tar.gz <app-pod>:/tmp/uploads_backup.tar.gz
  kubectl -n prod exec -i <app-pod> -- sh -lc "cd /app/public && tar xzf /tmp/uploads_backup.tar.gz --strip-components=1"
  ```

## Важные правила и ограничения

### ✅ МОЖНО делать

- Деплоить новые версии приложения через CI или `rollout.sh`
- Обновлять конфигурацию (ConfigMap, Secrets)
- Масштабировать реплики приложения
- Проверять логи: `kubectl -n prod logs <pod> -c app`

### ⚠️ НЕЛЬЗЯ делать автоматически

- **Запускать миграции БД** — схема БД не должна меняться при деплоях
- **Менять учетные данные БД** — используем фиксированные `staging_user`/`staging_password`
- **Удалять PVC** — потеря данных фото и БД
- **Использовать тег `latest`** — всегда использовать конкретные версии (`v20251030202308`)

### 🔧 Ручные операции (только после бэкапа)

- Изменения схемы БД — через `scripts/run_db_migration.sh` внутри pod'а
- Обновление учетных данных — через секреты и перезапуск
- Восстановление данных — из резервных копий

## Приложение и технологии

- **Framework**: Next.js 15.5.6
- **Database**: PostgreSQL 15 (Prisma ORM)
- **Порт**: 3001
- **Health endpoint**: `/api/health`
- **Основные таблицы**: `property_photos`, `products`, `catalog_categories`, `clients`, `quotes`, `invoices`, `orders`

## Контакты и доступ

- **Публичный URL**: http://158.160.202.117
- **Health check**: http://158.160.202.117/api/health
- **Тестовая ВМ**: http://130.193.40.35:3001
- **SSH тестовой ВМ**: `ubuntu@130.193.40.35` (ключ в `C:\Users\petr2\.ssh\ssh-key-1757583003347\`)

## Следующие шаги (опционально)

1. **HTTPS/Ingress**: настроить Ingress с cert-manager для автоматических SSL сертификатов
2. **Мониторинг**: добавить Prometheus/Grafana для метрик
3. **Логирование**: централизованный сбор логов (ELK или аналог)
4. **Автоматизация бэкапов**: cronjobs для автоматических резервных копий БД и фото

---

**Последнее обновление**: 2025-10-31  
**Статус**: ✅ Все системы работают, база данных и фото восстановлены в проде

