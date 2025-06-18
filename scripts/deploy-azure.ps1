# Azure Container Apps Deployment Script
# Quick deployment script for Vinod Electronics Search App

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$Environment
)

$ResourceGroup = "ve"
$ContainerRegistry = "vinodelectronics"
$ImageName = "vinod-electronics"

Write-Host "🚀 Starting deployment to $Environment environment..." -ForegroundColor Green

# Step 1: Build and push Docker image
Write-Host "🐳 Building and pushing Docker image..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$imageTag = "$ContainerRegistry.azurecr.io/$ImageName`:$timestamp"
$latestTag = "$ContainerRegistry.azurecr.io/$ImageName`:latest"

docker build -t $imageTag .
docker tag $imageTag $latestTag
docker push $imageTag
docker push $latestTag

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Docker build/push failed!"
    exit 1
}

# Step 2: Deploy to Azure Container Apps
Write-Host "☁️ Deploying to Azure Container Apps ($Environment)..." -ForegroundColor Yellow

if ($Environment -eq "staging") {
    $parametersFile = "infrastructure/staging.parameters.json"
} else {
    $parametersFile = "infrastructure/main.parameters.json"
}

az deployment group create `
    --resource-group $ResourceGroup `
    --template-file infrastructure/main.bicep `
    --parameters "@$parametersFile" `
    --parameters containerImage=$imageTag

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Azure deployment failed!"
    exit 1
}

# Step 3: Get deployment URLs
Write-Host "🔍 Getting deployment information..." -ForegroundColor Yellow

$apps = az containerapp list --resource-group $ResourceGroup --query "[].{Name:name, URL:properties.configuration.ingress.fqdn}" --output json | ConvertFrom-Json

foreach ($app in $apps) {
    if ($app.Name -like "*$Environment*" -or ($Environment -eq "production" -and $app.Name -eq "vinod-electronics")) {
        $url = "https://$($app.URL)"
        Write-Host "🌐 $($app.Name): $url" -ForegroundColor Cyan
        
        # Test health endpoint
        Write-Host "🧪 Testing health endpoint..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "$url/health" -UseBasicParsing -TimeoutSec 30
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Health check passed!" -ForegroundColor Green
            } else {
                Write-Warning "⚠️ Health check returned status: $($response.StatusCode)"
            }
        }
        catch {
            Write-Warning "⚠️ Health check failed: $($_.Exception.Message)"
        }
    }
}

Write-Host "🎉 Deployment to $Environment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  - Environment: $Environment" -ForegroundColor White
Write-Host "  - Image: $imageTag" -ForegroundColor White
Write-Host "  - Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "  - Timestamp: $timestamp" -ForegroundColor White
