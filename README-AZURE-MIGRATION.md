# 🚀 Azure Container Apps Migration - Quick Start

## Overview
Successfully migrated from Azure Static Web Apps to Azure Container Apps for full-stack deployment with staging environment.

## ✅ What's Included

### 🐳 Docker Configuration
- **Dockerfile**: Multi-stage build for optimized production image
- **docker-compose.yml**: Local development and testing
- **docker-compose.prod.yml**: Production configuration
- **.dockerignore**: Optimized build context

### 🏗️ Infrastructure as Code
- **infrastructure/main.bicep**: Azure Bicep templates
- **infrastructure/main.parameters.json**: Production parameters
- **infrastructure/staging.parameters.json**: Staging parameters

### 🔄 Deployment Scripts
- **scripts/setup-azure.ps1**: One-time Azure setup
- **scripts/deploy.ps1**: PowerShell deployment script
- **scripts/test-docker.ps1**: Local Docker testing

### 🤖 CI/CD Pipeline
- **.github/workflows/azure-container-apps.yml**: Complete GitHub Actions workflow

## 🚀 Quick Deployment

### 1. Prerequisites
```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Install Docker Desktop
winget install Docker.DockerDesktop

# Start Docker Desktop
```

### 2. Setup Azure (One-time)
```powershell
# Clone repository and navigate to project
cd c:\Users\vinodsharma\Personal_Workspace\search-data

# Run Azure setup
npm run azure:setup -- -SubscriptionId "your-subscription-id"
```

### 3. Test Docker Build Locally
```powershell
# Test Docker build and run
.\scripts\test-docker.ps1

# Access at: http://localhost:5001
```

### 4. Deploy to Azure
```powershell
# Deploy to staging
npm run azure:deploy:staging

# Deploy to production
npm run azure:deploy:production
```

## 🌐 Environment URLs

After deployment, your applications will be available at:

- **Production**: `https://vinod-electronics.azurecontainerapps.io`
- **Staging**: `https://vinod-electronics-staging.azurecontainerapps.io`

## 🔧 GitHub Actions Setup

### Required Secrets
Add these secrets to your GitHub repository:

```
ACR_USERNAME=vinodelectronics
ACR_PASSWORD=[from Azure Portal]
AZURE_CREDENTIALS=[Service Principal JSON]
JWT_SECRET_PRODUCTION=[secure 256-bit key]
JWT_SECRET_STAGING=[secure 256-bit key]
GOOGLE_SHEET_ID=[your Google Sheet ID]
GOOGLE_API_KEY=[your Google API Key]
```

### Create Service Principal
```powershell
az ad sp create-for-rbac --name "vinod-electronics-github-actions" `
    --role contributor `
    --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/rg-vinod-electronics `
    --sdk-auth
```

## 📋 Available Commands

```powershell
# Development
npm run dev                    # Start both frontend and backend
npm run dev:frontend          # Start frontend only
npm run dev:backend           # Start backend only

# Build and Test
npm run build                 # Build both applications
npm run test                  # Run tests

# Docker
npm run docker:build          # Build Docker image
npm run docker:run            # Run Docker container
npm run docker:compose        # Run with docker-compose
npm run docker:compose:prod   # Run production docker-compose

# Azure Deployment
npm run azure:setup           # Setup Azure infrastructure
npm run azure:deploy          # Deploy to production
npm run azure:deploy:staging  # Deploy to staging
npm run azure:deploy:production # Deploy to production
```

## 🔍 Monitoring and Debugging

### View Container Logs
```powershell
# Production logs
az containerapp logs show --name vinod-electronics --resource-group rg-vinod-electronics --follow

# Staging logs
az containerapp logs show --name vinod-electronics-staging --resource-group rg-vinod-electronics --follow
```

### Health Checks
- **Production**: `https://vinod-electronics.azurecontainerapps.io/health`
- **Staging**: `https://vinod-electronics-staging.azurecontainerapps.io/health`

### Performance Monitoring
- **Log Analytics**: Integrated with Azure Monitor
- **Application Insights**: Available for advanced monitoring
- **Auto-scaling**: CPU and HTTP request based

## 🔒 Security Features

- **HTTPS Only**: All traffic encrypted
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Protection against abuse
- **CORS Protection**: Origin restrictions
- **Security Headers**: Helmet.js integration
- **Secret Management**: Azure Container Apps secrets

## 📈 Scaling Configuration

### Production
- **Min Replicas**: 2
- **Max Replicas**: 10
- **CPU**: 1.0 cores per replica
- **Memory**: 2Gi per replica

### Staging
- **Min Replicas**: 1
- **Max Replicas**: 3
- **CPU**: 0.5 cores per replica
- **Memory**: 1Gi per replica

## 🚨 Troubleshooting

### Common Issues
1. **Container not starting**: Check logs with `az containerapp logs show`
2. **Health check failing**: Verify environment variables
3. **Image pull errors**: Check ACR credentials
4. **Build failures**: Test Docker build locally

### Support Resources
- **Azure Container Apps Documentation**: [aka.ms/container-apps](https://aka.ms/container-apps)
- **GitHub Actions Logs**: Check workflow runs
- **Local Testing**: Use `scripts/test-docker.ps1`

## 🎯 Next Steps

1. **Configure Custom Domain**: Point your domain to Container Apps
2. **Set up SSL Certificate**: Use Azure-managed certificates
3. **Configure Monitoring**: Set up Application Insights
4. **Database Migration**: Move to external database for production
5. **CDN Setup**: Use Azure Front Door for global distribution

---

**Migration Status**: ✅ **COMPLETE** - Ready for production use with full staging environment support.

For detailed deployment instructions, see [AZURE-CONTAINER-APPS-GUIDE.md](./AZURE-CONTAINER-APPS-GUIDE.md)
