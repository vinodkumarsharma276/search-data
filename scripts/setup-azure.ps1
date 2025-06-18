# PowerShell script to set up Azure Container Apps infrastructure
param(
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "rg-vinod-electronics",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "East US"
)

$ErrorActionPreference = "Stop"

Write-Host "🏗️ Setting up Azure Container Apps Infrastructure" -ForegroundColor Green
Write-Host "📦 Resource Group: $ResourceGroup" -ForegroundColor Cyan
Write-Host "📍 Location: $Location" -ForegroundColor Cyan

# Check if Azure CLI is available
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✅ Azure CLI version: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please restart PowerShell after installation." -ForegroundColor Red
    Write-Host "   If you just installed Azure CLI, close this PowerShell window and open a new one." -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Azure
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
    Write-Host "✅ Current subscription: $($account.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Please log in to Azure first:" -ForegroundColor Red
    Write-Host "   az login" -ForegroundColor Yellow
    exit 1
}

# Set subscription if provided
if ($SubscriptionId) {
    Write-Host "🔧 Setting subscription: $SubscriptionId" -ForegroundColor Yellow
    az account set --subscription $SubscriptionId
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to set subscription. Please check the subscription ID." -ForegroundColor Red
        exit 1
    }
}

# Register required providers
Write-Host "📝 Registering Azure providers..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

$providers = @("Microsoft.App", "Microsoft.OperationalInsights", "Microsoft.ContainerRegistry")
foreach ($provider in $providers) {
    Write-Host "   Registering $provider..." -ForegroundColor Gray
    az provider register --namespace $provider --wait
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $provider registered successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ $provider registration may have failed (this might be okay if already registered)" -ForegroundColor Yellow
    }
}

# Install Container Apps extension
Write-Host "🔧 Installing Container Apps CLI extension..." -ForegroundColor Yellow
az extension add --name containerapp --upgrade

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container Apps extension installed" -ForegroundColor Green
} else {
    Write-Host "⚠️ Extension installation may have failed (might already be installed)" -ForegroundColor Yellow
}

# Create resource group
Write-Host "📦 Creating resource group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output table

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Resource group created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create resource group" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Azure setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test Docker build locally: npm run docker:test" -ForegroundColor White
Write-Host "   2. Deploy infrastructure: az deployment group create --resource-group $ResourceGroup --template-file infrastructure/main.bicep --parameters '@infrastructure/main.parameters.json'" -ForegroundColor White
Write-Host "   3. Deploy to staging: npm run azure:deploy:staging" -ForegroundColor White
Write-Host "   4. Deploy to production: npm run azure:deploy:production" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your apps will be available at:" -ForegroundColor Cyan
Write-Host "   Production: https://vinod-electronics.azurecontainerapps.io" -ForegroundColor White
Write-Host "   Staging: https://vinod-electronics-staging.azurecontainerapps.io" -ForegroundColor White
