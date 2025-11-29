$sshKey = 'C:\Users\petr2\.ssh\ssh-key-1757583003347\ssh-key-1757583003347'
$stagingHost = 'ubuntu@130.193.40.35'

Write-Host ' Проверка статуса контейнера...' -ForegroundColor Cyan
ssh -i $sshKey $stagingHost 'docker ps -a --filter name=domeo-staging-app'

Write-Host '
 Последние логи контейнера...' -ForegroundColor Yellow
ssh -i $sshKey $stagingHost 'docker logs domeo-staging-app --tail 30'

Write-Host '
 Проверка health check...' -ForegroundColor Yellow
ssh -i $sshKey $stagingHost 'curl -s http://localhost:3001/api/health || echo Health check failed'
