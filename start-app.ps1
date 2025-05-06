# Start the backend and frontend in separate terminals
Write-Host "Repairing video files..." -ForegroundColor Yellow
node repair-videos.js

Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; ./improved-restart-server.bat"

Write-Host "Starting frontend dev server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD/frontend'; npm run dev"

Write-Host "Both servers have been started in separate windows." -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:5175" -ForegroundColor Cyan
Write-Host "Backend API running at: http://localhost:8000" -ForegroundColor Cyan

Write-Host "Debug Info:" -ForegroundColor Yellow 
Write-Host "- If you get a port conflict error, run 'node debug-server.js' to diagnose issues" -ForegroundColor Yellow
Write-Host "- To view log files, check terminal output in the backend window" -ForegroundColor Yellow
Write-Host "- If videos are not working, run 'node repair-videos.js' to fix them" -ForegroundColor Yellow 