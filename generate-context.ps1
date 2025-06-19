# AI Context Restoration Script for Vinod Electronics Search Application
# Run this script to quickly generate context for AI assistants

Write-Host "🚀 Generating AI Assistant Context..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Set the project directory
$projectDir = "c:\Users\vinodsharma\Personal_Workspace\search-data"
Set-Location $projectDir

Write-Host "`n📁 Project Structure:" -ForegroundColor Yellow
tree /f | Select-Object -First 50

Write-Host "`n📊 Git Status:" -ForegroundColor Yellow
git status --porcelain
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git repository is clean" -ForegroundColor Green
} else {
    Write-Host "⚠️  Uncommitted changes detected" -ForegroundColor Yellow
}

Write-Host "`n📋 Recent Commits:" -ForegroundColor Yellow
git log --oneline -10

Write-Host "`n🔧 Current Branch:" -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "Branch: $currentBranch" -ForegroundColor Cyan

Write-Host "`n🌐 Application Health Check:" -ForegroundColor Yellow
try {
    $healthUrl = "https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/health"
    $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 10
    Write-Host "✅ Application Status: $($response.status)" -ForegroundColor Green
    Write-Host "📊 Uptime: $($response.uptime)" -ForegroundColor Cyan
    Write-Host "🔧 Environment:" -ForegroundColor Cyan
    $response.environment | ConvertTo-Json | Write-Host
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📝 Key Files Status:" -ForegroundColor Yellow
$keyFiles = @(
    "CONTEXT.md",
    "RESTORE_CONTEXT.md", 
    "README.md",
    "backend\server.js",
    "backend\models\User.js",
    "frontend\package.json",
    "Dockerfile",
    ".github\workflows\azure-container-apps.yml"
)

foreach ($file in $keyFiles) {
    if (Test-Path $file) {
        $lastModified = (Get-Item $file).LastWriteTime.ToString("yyyy-MM-dd HH:mm")
        Write-Host "✅ $file (Modified: $lastModified)" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (Missing)" -ForegroundColor Red
    }
}

Write-Host "`n🎯 Context Summary:" -ForegroundColor Yellow
Write-Host "===================" -ForegroundColor Cyan
Write-Host "• Project: Vinod Electronics Search (PWA)" -ForegroundColor White
Write-Host "• Status: Production Ready ✅" -ForegroundColor Green
Write-Host "• Deployment: Azure Container Apps" -ForegroundColor White
Write-Host "• URL: https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/" -ForegroundColor White
Write-Host "• Data Source: Google Sheets API" -ForegroundColor White
Write-Host "• Authentication: JWT with role-based permissions" -ForegroundColor White

Write-Host "`n📋 For AI Assistant:" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor Cyan
Write-Host "1. Read CONTEXT.md for complete overview" -ForegroundColor White
Write-Host "2. Read RESTORE_CONTEXT.md for quick start guide" -ForegroundColor White
Write-Host "3. Check health endpoint for current status" -ForegroundColor White
Write-Host "4. Review recent git commits for latest changes" -ForegroundColor White
Write-Host "5. Use semantic search to find relevant code" -ForegroundColor White

Write-Host "`n✨ Context generation complete!" -ForegroundColor Green
Write-Host "Copy this output along with CONTEXT.md to your AI assistant." -ForegroundColor Cyan

# Pause to let user read the output
Write-Host "`nPress any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
