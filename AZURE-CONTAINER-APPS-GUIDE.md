# Azure Container Apps Deployment Guide

## 🚀 Overview

This guide will help you deploy the Vinod Electronics Search application to Azure Container Apps with both staging and production environments.

## 📋 Prerequisites

### Required Tools
- **Azure CLI**: [Download here](https://aka.ms/installazurecliwindows)
- **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop)
- **PowerShell**: Built into Windows
- **Git**: For version control and CI/CD

### Azure Requirements
- Azure subscription with Container Apps enabled
- Resource group permissions
- Container Registry access

## 🏗️ Infrastructure Setup

### Step 1: Initial Azure Setup

```powershell
# Run the setup script (one-time setup)
.\scripts\setup-azure.ps1 -SubscriptionId "your-subscription-id"
```

This script will:
- Log you into Azure
- Register required providers
- Create the resource group
- Install Container Apps CLI extension

### Step 2: Deploy Infrastructure

```powershell
# Deploy to production
.\scripts\deploy.ps1 -Environment production

# Deploy to staging
.\scripts\deploy.ps1 -Environment staging
```

## 🔧 Configuration

### Environment Variables

The application requires these environment variables:

#### Production Environment
```env
NODE_ENV=production
PORT=5001
JWT_SECRET=your-production-256-bit-secret-key
GOOGLE_SHEET_ID=your-google-sheet-id
GOOGLE_API_KEY=your-google-api-key
CACHE_TTL=3600000
DATA_REFRESH_INTERVAL=86400000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=150
ALLOWED_ORIGINS=https://vinod-electronics.azurecontainerapps.io
```

#### Staging Environment
```env
NODE_ENV=staging
PORT=5001
JWT_SECRET=your-staging-256-bit-secret-key
GOOGLE_SHEET_ID=your-google-sheet-id
GOOGLE_API_KEY=your-google-api-key
CACHE_TTL=3600000
DATA_REFRESH_INTERVAL=86400000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://vinod-electronics-staging.azurecontainerapps.io
```

### Security Notes
- **JWT_SECRET**: Generate a secure 256-bit key for production
- **GOOGLE_API_KEY**: Restrict API key to your domain
- **ALLOWED_ORIGINS**: Update with your actual domain names

## 🔄 CI/CD Setup with GitHub Actions

### Step 1: Configure GitHub Secrets

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

### Step 2: Create Service Principal

```powershell
# Create service principal for GitHub Actions
az ad sp create-for-rbac --name "vinod-electronics-github-actions" `
    --role contributor `
    --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/rg-vinod-electronics `
    --sdk-auth
```

Copy the JSON output to `AZURE_CREDENTIALS` secret.

### Step 3: Workflow Triggers

The GitHub Actions workflow triggers on:
- **Push to main**: Deploys to production
- **Pull requests**: Deploys to staging
- **Manual trigger**: Can deploy to either environment

## 🌐 Architecture

### Container Apps Environment

```
Internet → Azure Front Door (optional)
    ↓
Azure Container Apps Environment
    ↓
Container App (1-10 replicas)
    ↓
Node.js Backend + React Frontend
    ↓
Google Sheets API
```

### Scaling Configuration

#### Production
- **Min Replicas**: 2
- **Max Replicas**: 10
- **CPU**: 1.0 cores
- **Memory**: 2Gi
- **Auto-scaling**: HTTP requests + CPU utilization

#### Staging
- **Min Replicas**: 1
- **Max Replicas**: 3
- **CPU**: 0.5 cores
- **Memory**: 1Gi
- **Auto-scaling**: HTTP requests + CPU utilization

## 📊 Monitoring & Health Checks

### Health Endpoints
- **Health Check**: `/health`
- **Application**: `/`
- **API**: `/api/auth/me`

### Monitoring Features
- **Application Insights**: Integrated logging
- **Log Analytics**: Centralized logs
- **Health Probes**: Liveness and readiness checks
- **Auto-scaling**: Based on CPU and HTTP metrics

## 🔒 Security Features

### Container Security
- **Non-root user**: Container runs as non-privileged user
- **Secret management**: Secrets stored in Container Apps
- **HTTPS only**: All traffic encrypted
- **CORS protection**: Origin restrictions

### Application Security
- **JWT authentication**: Secure token-based auth
- **Rate limiting**: Protection against abuse
- **Input validation**: Protected API endpoints
- **Helmet.js**: Security headers

## 🚀 Deployment Process

### Automated Deployment (Recommended)

1. **Push to main branch** → Production deployment
2. **Create pull request** → Staging deployment
3. **Merge PR** → Production deployment

### Manual Deployment

```powershell
# Build and deploy to staging
.\scripts\deploy.ps1 -Environment staging

# Build and deploy to production
.\scripts\deploy.ps1 -Environment production
```

## 🧪 Testing

### Post-Deployment Tests

```powershell
# Health check
Invoke-WebRequest https://your-app.azurecontainerapps.io/health

# Frontend test
Invoke-WebRequest https://your-app.azurecontainerapps.io/

# API test (requires authentication)
$loginData = @{ username="test"; password="test123" } | ConvertTo-Json
Invoke-WebRequest https://your-app.azurecontainerapps.io/api/auth/login -Method POST -Body $loginData -ContentType "application/json"
```

### Load Testing

```powershell
# Simple load test
1..50 | ForEach-Object -Parallel {
    Invoke-WebRequest https://your-app.azurecontainerapps.io/health
} -ThrottleLimit 10
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Container App Not Starting
```powershell
# Check container logs
az containerapp logs show --name vinod-electronics --resource-group rg-vinod-electronics --follow
```

#### 2. Image Pull Errors
```powershell
# Verify ACR credentials
az acr credential show --name vinodelectronics
```

#### 3. Health Check Failures
```powershell
# Check application logs
az containerapp logs show --name vinod-electronics --resource-group rg-vinod-electronics --tail 100
```

#### 4. Environment Variable Issues
```powershell
# List current environment variables
az containerapp show --name vinod-electronics --resource-group rg-vinod-electronics --query "properties.template.containers[0].env"
```

### Log Analysis

```powershell
# Stream live logs
az containerapp logs show --name vinod-electronics --resource-group rg-vinod-electronics --follow

# Get recent logs
az containerapp logs show --name vinod-electronics --resource-group rg-vinod-electronics --tail 500
```

## 📈 Performance Optimization

### Container Optimization
- **Multi-stage build**: Reduces image size
- **Node.js optimization**: Production dependencies only
- **Static file serving**: Efficient frontend delivery
- **Health checks**: Fast startup detection

### Application Optimization
- **Caching**: In-memory data caching
- **Compression**: Gzip compression enabled
- **CDN ready**: Static assets optimized
- **Database pooling**: Ready for external database

## 🔄 Updates and Maintenance

### Rolling Updates
Container Apps provides zero-downtime deployments with rolling updates.

### Backup Strategy
- **Configuration**: Store in version control
- **Secrets**: Use Azure Key Vault
- **Data**: Google Sheets serves as primary data store

### Monitoring Alerts
Set up alerts for:
- High CPU usage (>80%)
- High memory usage (>80%)
- Error rate increase
- Response time degradation

## 📞 Support

For deployment issues:
1. Check the logs using Azure CLI
2. Verify environment variables
3. Test local Docker build
4. Check GitHub Actions workflow logs
5. Review this deployment guide

## 🎯 Next Steps

After successful deployment:
1. **Custom Domain**: Configure your own domain
2. **SSL Certificate**: Set up custom SSL
3. **Monitoring**: Configure Application Insights
4. **Backup**: Set up automated backups
5. **Scaling**: Adjust scaling rules based on usage

---

**Status**: Ready for production deployment with full staging environment support.
