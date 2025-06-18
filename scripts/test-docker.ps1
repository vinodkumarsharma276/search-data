# Test Docker Build and Run Locally
param(
    [Parameter(Mandatory=$false)]
    [int]$Port = 5001
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 Testing Docker build locally" -ForegroundColor Green
Write-Host "📦 Port: $Port" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Build the image
Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
docker build -t vinod-electronics:test .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker build successful!" -ForegroundColor Green

# Check if port is in use
$portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️ Port $Port is in use. Stopping existing containers..." -ForegroundColor Yellow
    docker stop $(docker ps -q --filter "publish=$Port") 2>$null
}

# Run the container
Write-Host "🚀 Starting container on port $Port..." -ForegroundColor Yellow
$containerId = docker run -d -p "${Port}:5001" `
    -e NODE_ENV=production `
    -e PORT=5001 `
    -e JWT_SECRET=test-secret-key `
    -e GOOGLE_SHEET_ID=$env:GOOGLE_SHEET_ID `
    -e GOOGLE_API_KEY=$env:GOOGLE_API_KEY `
    -e CACHE_TTL=3600000 `
    -e DATA_REFRESH_INTERVAL=86400000 `
    -e RATE_LIMIT_WINDOW_MS=900000 `
    -e RATE_LIMIT_MAX_REQUESTS=100 `
    -e ALLOWED_ORIGINS="http://localhost:$Port" `
    --name vinod-electronics-test `
    vinod-electronics:test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start container!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Container started with ID: $containerId" -ForegroundColor Green

# Wait for container to be ready
Write-Host "⏳ Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test health endpoint
$maxAttempts = 6
$attempt = 1
$healthCheckPassed = $false

while ($attempt -le $maxAttempts -and -not $healthCheckPassed) {
    try {
        Write-Host "🧪 Attempt $attempt/$maxAttempts - Testing health endpoint..." -ForegroundColor Yellow
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -Method Get -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            $healthData = $response.Content | ConvertFrom-Json
            Write-Host "✅ Health check passed!" -ForegroundColor Green
            Write-Host "   Status: $($healthData.status)" -ForegroundColor White
            Write-Host "   Uptime: $([math]::Round($healthData.uptime, 2)) seconds" -ForegroundColor White
            $healthCheckPassed = $true
        }
    } catch {
        Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds 5
        $attempt++
    }
}

if (-not $healthCheckPassed) {
    Write-Host "❌ Health check failed after $maxAttempts attempts!" -ForegroundColor Red
    Write-Host "📝 Container logs:" -ForegroundColor Yellow
    docker logs vinod-electronics-test
    docker stop vinod-electronics-test | Out-Null
    docker rm vinod-electronics-test | Out-Null
    exit 1
}

# Test frontend
try {
    Write-Host "🧪 Testing frontend..." -ForegroundColor Yellow
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:$Port/" -Method Get -TimeoutSec 10
    
    if ($frontendResponse.StatusCode -eq 200 -and $frontendResponse.Content -like "*Vinod Electronics*") {
        Write-Host "✅ Frontend test passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend test failed - content check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Docker test completed!" -ForegroundColor Green
Write-Host "🌐 Application URL: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "📊 Health Check: http://localhost:$Port/health" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Open http://localhost:$Port in your browser" -ForegroundColor White
Write-Host "   2. Test login functionality" -ForegroundColor White
Write-Host "   3. Test search functionality" -ForegroundColor White
Write-Host "   4. Stop container: docker stop vinod-electronics-test" -ForegroundColor White
Write-Host "   5. Remove container: docker rm vinod-electronics-test" -ForegroundColor White

Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Yellow
Write-Host "   View logs: docker logs vinod-electronics-test" -ForegroundColor White
Write-Host "   Stop: docker stop vinod-electronics-test" -ForegroundColor White
Write-Host "   Remove: docker rm vinod-electronics-test" -ForegroundColor White
