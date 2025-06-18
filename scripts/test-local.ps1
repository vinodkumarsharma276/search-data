# Simple local testing script
Write-Host "🧪 Testing Local Development Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan

# Check if Node.js is available
Write-Host ""
Write-Host "📋 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is available
Write-Host "📋 Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found." -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
Write-Host "📋 Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ Root dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️ Root dependencies not installed. Installing..." -ForegroundColor Yellow
    npm install
}

if (Test-Path "frontend/node_modules") {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️ Frontend dependencies not installed. Installing..." -ForegroundColor Yellow
    npm install --workspace=frontend
}

if (Test-Path "backend/node_modules") {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️ Backend dependencies not installed. Installing..." -ForegroundColor Yellow
    npm install --workspace=backend
}

# Check environment file
Write-Host "📋 Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ Environment file found" -ForegroundColor Green
    Write-Host "📄 Current .env contents:" -ForegroundColor Cyan
    Get-Content ".env" | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
}

# Check if backend .env exists
if (Test-Path "backend/.env") {
    Write-Host "✅ Backend environment file found" -ForegroundColor Green
} else {
    Write-Host "⚠️ Backend .env file not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Ready to test!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Available commands:" -ForegroundColor Yellow
Write-Host "   npm run dev              # Start both frontend and backend" -ForegroundColor White
Write-Host "   npm run dev:frontend     # Start frontend only" -ForegroundColor White
Write-Host "   npm run dev:backend      # Start backend only" -ForegroundColor White
Write-Host "   npm run build            # Build both applications" -ForegroundColor White
Write-Host "   npm run docker:test      # Test Docker build (requires Docker Desktop)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 If servers are running:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend API: http://localhost:5001" -ForegroundColor White
Write-Host "   Health Check: http://localhost:5001/health" -ForegroundColor White
