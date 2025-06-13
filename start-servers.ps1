# Start both frontend and backend servers with correct ports
Write-Host "🚀 Starting Frontend and Backend servers..." -ForegroundColor Green

# Start backend on port 5001 (override system PORT env var)
$env:PORT = "5001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\vinodsharma\Personal_Workspace\search-data\backend'; `$env:PORT='5001'; npm run dev" -WindowStyle Normal

# Wait a moment
Start-Sleep -Seconds 2

# Start frontend (will use port 5174 since 5173 is in use)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\vinodsharma\Personal_Workspace\search-data\frontend'; npm run dev" -WindowStyle Normal

Write-Host "✅ Both servers starting..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5174" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5001" -ForegroundColor Cyan
