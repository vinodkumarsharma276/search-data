# Azure Container Apps Deployment Script for Windows PowerShell
# This script deploys the Vinod Electronics Search app to Azure Container Apps

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "staging")]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId = $env:AZURE_SUBSCRIPTION_ID,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "rg-vinod-electronics",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "East US"
)

# Configuration
$ErrorActionPreference = "Stop"
$ContainerRegistryName = "vinodelectronics"
$ContainerName = "vinod-electronics-app"

Write-Host "🚀 Deploying to Azure Container Apps" -ForegroundColor Green
Write-Host "📋 Environment: $Environment" -ForegroundColor Cyan
Write-Host "📍 Location: $Location" -ForegroundColor Cyan
Write-Host "📦 Resource Group: $ResourceGroup" -ForegroundColor Cyan

# Check if Azure CLI is installed
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✅ Azure CLI version: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install Azure CLI first." -ForegroundColor Red
    Write-Host "   Download from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Azure
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Please log in to Azure first:" -ForegroundColor Red
    Write-Host "   az login" -ForegroundColor Yellow
    exit 1
}

# Set subscription if provided
if ($SubscriptionId) {
    Write-Host "🔧 Setting subscription: $SubscriptionId" -ForegroundColor Yellow
    az account set --subscription $SubscriptionId
}

# Create resource group if it doesn't exist
Write-Host "📦 Creating resource group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output table

# Deploy infrastructure
Write-Host "🏗️ Deploying infrastructure..." -ForegroundColor Yellow
$ParametersFile = if ($Environment -eq "staging") { 
    "infrastructure\staging.parameters.json" 
} else { 
    "infrastructure\main.parameters.json" 
}

az deployment group create `
    --resource-group $ResourceGroup `
    --template-file "infrastructure\main.bicep" `
    --parameters "@$ParametersFile" `
    --output table

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Infrastructure deployment failed!" -ForegroundColor Red
    exit 1
}

# Get container registry credentials
Write-Host "🔐 Getting container registry credentials..." -ForegroundColor Yellow
$AcrUsername = az acr credential show --name $ContainerRegistryName --query "username" -o tsv
$AcrPassword = az acr credential show --name $ContainerRegistryName --query "passwords[0].value" -o tsv

Write-Host "✅ Container Registry Credentials:" -ForegroundColor Green
Write-Host "   Registry: $ContainerRegistryName.azurecr.io" -ForegroundColor White
Write-Host "   Username: $AcrUsername" -ForegroundColor White
Write-Host "   Password: [HIDDEN]" -ForegroundColor White

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    Write-Host "   Trying to start Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Hidden
    Write-Host "   Waiting for Docker to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    try {
        docker version | Out-Null
        Write-Host "✅ Docker started successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start Docker. Please start Docker Desktop manually." -ForegroundColor Red
        exit 1
    }
}

# Build and push container image
Write-Host "🐳 Building and pushing container image..." -ForegroundColor Yellow
$ImageTag = Get-Date -Format "yyyyMMddHHmmss"
$FullImageName = "$ContainerRegistryName.azurecr.io/$ContainerName"

# Login to ACR
Write-Host "🔐 Logging into Azure Container Registry..." -ForegroundColor Yellow
az acr login --name $ContainerRegistryName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to login to Azure Container Registry!" -ForegroundColor Red
    exit 1
}

# Build images
Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
docker build -t "${FullImageName}:${ImageTag}" .
docker build -t "${FullImageName}:latest" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

# Push images
Write-Host "📤 Pushing images to registry..." -ForegroundColor Yellow
docker push "${FullImageName}:${ImageTag}"
docker push "${FullImageName}:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker push failed!" -ForegroundColor Red
    exit 1
}

# Update container app with new image
Write-Host "🚀 Updating container app..." -ForegroundColor Yellow
$ContainerAppName = if ($Environment -eq "staging") { 
    "vinod-electronics-staging" 
} else { 
    "vinod-electronics" 
}

az containerapp update `
    --name $ContainerAppName `
    --resource-group $ResourceGroup `
    --image "${FullImageName}:${ImageTag}" `
    --output table

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Container app update failed!" -ForegroundColor Red
    exit 1
}

# Get the application URL
Write-Host "🌐 Getting application URL..." -ForegroundColor Yellow
$AppUrl = az containerapp show `
    --name $ContainerAppName `
    --resource-group $ResourceGroup `
    --query "properties.configuration.ingress.fqdn" -o tsv

Write-Host ""
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Application URL: https://$AppUrl" -ForegroundColor Cyan
Write-Host "📊 Health Check: https://$AppUrl/health" -ForegroundColor Cyan
Write-Host ""

# Run basic health check
Write-Host "🧪 Running health check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$AppUrl/health" -Method Get -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health check passed!" -ForegroundColor Green
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($healthData.status)" -ForegroundColor White
        Write-Host "   Uptime: $([math]::Round($healthData.uptime, 2)) seconds" -ForegroundColor White
    } else {
        Write-Host "❌ Health check failed! Status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Health check failed! Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   The application might still be starting up..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "📱 Access your application at: https://$AppUrl" -ForegroundColor Cyan
Write-Host ""

# Display next steps
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test the application in your browser" -ForegroundColor White
Write-Host "   2. Configure custom domain (optional)" -ForegroundColor White
Write-Host "   3. Set up monitoring and alerts" -ForegroundColor White
Write-Host "   4. Configure GitHub Actions secrets for CI/CD" -ForegroundColor White

# Display GitHub Actions secrets needed
Write-Host ""
Write-Host "🔐 GitHub Actions Secrets needed:" -ForegroundColor Yellow
Write-Host "   ACR_USERNAME: $AcrUsername" -ForegroundColor White
Write-Host "   ACR_PASSWORD: [Get from Azure Portal]" -ForegroundColor White
Write-Host "   AZURE_CREDENTIALS: [Service Principal JSON]" -ForegroundColor White
Write-Host "   JWT_SECRET_PRODUCTION: [Generate secure 256-bit key]" -ForegroundColor White
Write-Host "   JWT_SECRET_STAGING: [Generate secure 256-bit key]" -ForegroundColor White
Write-Host "   GOOGLE_SHEET_ID: [Your Google Sheet ID]" -ForegroundColor White
Write-Host "   GOOGLE_API_KEY: [Your Google API Key]" -ForegroundColor White
