$sshKey = 'C:\Users\petr2\.ssh\ssh-key-1757583003347\ssh-key-1757583003347'
$stagingHost = 'ubuntu@130.193.40.35'

Write-Host '1  Остановка контейнера...' -ForegroundColor Yellow
ssh -i $sshKey $stagingHost 'docker stop domeo-staging-app 2>&1'

Write-Host '2  Удаление контейнера...' -ForegroundColor Yellow  
ssh -i $sshKey $stagingHost 'docker rm domeo-staging-app 2>&1'

Write-Host '3  Обновление кода...' -ForegroundColor Yellow
ssh -i $sshKey $stagingHost 'cd /opt/domeo && git pull origin main'

Write-Host '4  Запуск контейнера через docker-compose...' -ForegroundColor Yellow
ssh -i $sshKey $stagingHost 'cd /opt/domeo && docker compose up -d domeo-staging-app'

Write-Host '
 Ожидание запуска (10 секунд)...' -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host '5  Проверка статуса...' -ForegroundColor Yellow
ssh -i $sshKey $stagingHost 'docker ps --filter name=domeo-staging-app'

Write-Host '
 Готово!' -ForegroundColor Green
