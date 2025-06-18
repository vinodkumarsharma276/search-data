# Complete Azure Container Apps Setup Guide
# Run this step by step after restarting PowerShell

Write-Host "🚀 Azure Container Apps Setup for Vinod Electronics" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

# Step 1: Verify Azure CLI Installation
Write-Host ""
Write-Host "📋 Step 1: Verifying Azure CLI Installation" -ForegroundColor Yellow
Write-Host "Please restart PowerShell and run this command to verify:" -ForegroundColor White
Write-Host "az --version" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Step 2: Login to Azure" -ForegroundColor Yellow
Write-Host "Run this command to login to your Azure account:" -ForegroundColor White
Write-Host "az login" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Step 3: Set Your Subscription" -ForegroundColor Yellow
Write-Host "List your subscriptions:" -ForegroundColor White
Write-Host "az account list --output table" -ForegroundColor Cyan
Write-Host ""
Write-Host "Set your subscription (replace with your subscription ID):" -ForegroundColor White
Write-Host "az account set --subscription 'your-subscription-id'" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Step 4: Register Required Providers" -ForegroundColor Yellow
Write-Host "Run these commands to register required Azure providers:" -ForegroundColor White
Write-Host "az provider register --namespace Microsoft.App --wait" -ForegroundColor Cyan
Write-Host "az provider register --namespace Microsoft.OperationalInsights --wait" -ForegroundColor Cyan
Write-Host "az provider register --namespace Microsoft.ContainerRegistry --wait" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Step 5: Install Container Apps Extension" -ForegroundColor Yellow
Write-Host "Install the Container Apps CLI extension:" -ForegroundColor White
Write-Host "az extension add --name containerapp --upgrade" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Step 6: Create Resource Group" -ForegroundColor Yellow
Write-Host "Create a resource group for your application:" -ForegroundColor White
Write-Host "az group create --name rg-vinod-electronics --location 'East US'" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Step 7: Deploy Infrastructure" -ForegroundColor Yellow
Write-Host "Deploy the Container Apps infrastructure:" -ForegroundColor White
Write-Host "az deployment group create --resource-group rg-vinod-electronics --template-file infrastructure/main.bicep --parameters '@infrastructure/main.parameters.json'" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Step 8: Test Docker Build Locally" -ForegroundColor Yellow
Write-Host "Before deploying, test the Docker build:" -ForegroundColor White
Write-Host "npm run docker:test" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Step 9: Deploy Application" -ForegroundColor Yellow
Write-Host "Deploy to staging first:" -ForegroundColor White
Write-Host "npm run azure:deploy:staging" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then deploy to production:" -ForegroundColor White
Write-Host "npm run azure:deploy:production" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎉 After Setup Complete:" -ForegroundColor Green
Write-Host "Your applications will be available at:" -ForegroundColor White
Write-Host "  Production: https://vinod-electronics.azurecontainerapps.io" -ForegroundColor Cyan
Write-Host "  Staging: https://vinod-electronics-staging.azurecontainerapps.io" -ForegroundColor Cyan

Write-Host ""
Write-Host "📞 Need Help?" -ForegroundColor Yellow
Write-Host "If you encounter any issues, check:" -ForegroundColor White
Write-Host "  1. Azure CLI version: az --version" -ForegroundColor Cyan
Write-Host "  2. Your subscription access: az account show" -ForegroundColor Cyan
Write-Host "  3. Provider registration: az provider show --namespace Microsoft.App" -ForegroundColor Cyan
