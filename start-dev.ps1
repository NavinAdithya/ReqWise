# Start REQWISE development servers

Write-Host "Starting REQWISE Backend..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c cd backend && npm run dev"

Start-Sleep -Seconds 5

Write-Host "Starting REQWISE Frontend..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c cd frontend && npm run dev"

Write-Host "Both servers starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
