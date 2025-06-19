# Vinod Electronics Search Application - Complete Context

> **Created by**: GitHub Copilot AI Assistant  
> **Project Started**: December 2024  
> **Last Updated**: December 2024  
> **Status**: Production Ready ✅

## 🎯 **Project Overview**

This is a **Progressive Web Application (PWA)** built for Vinod Electronics to search and manage customer electronics data. The application integrates with Google Sheets as a data source and provides a secure, role-based search interface.

### **Live Application**
- **Production URL**: https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/
- **Health Check**: https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/health

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Google Sheets  │
│   (React PWA)   │◄──►│   (Node.js)     │◄──►│   (Data Source) │
│   Port: 3000    │    │   Port: 5001    │    │    (API v4)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Azure Static    │    │ Azure Container │    │ Google Cloud    │
│ Web Apps        │    │ Apps            │    │ Sheets API      │
│ (Production)    │    │ (Production)    │    │ (External)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Technology Stack**
- **Frontend**: React 18, Vite, PWA (Service Workers, Offline Support)
- **Backend**: Node.js, Express.js, JWT Authentication
- **Data Source**: Google Sheets API v4
- **Deployment**: Azure Container Apps
- **CI/CD**: GitHub Actions
- **Infrastructure**: Azure Bicep Templates

---

## 🔐 **Authentication & Security**

### **User Roles & Permissions**
```javascript
// Current Users (backend/models/User.js)
[
  {
    id: 1,
    username: 'jagdishsharma',
    role: 'admin',
    permissions: ['read', 'write', 'delete']
  },
  {
    id: 2, 
    username: 'vinodsharma',
    role: 'manager',
    permissions: ['read', 'write']
  },
  {
    id: 3,
    username: 'emp',
    role: 'employee', 
    permissions: ['read', 'write']  // ✅ Fixed during development
  }
]
```

### **JWT Configuration**
- **Secret**: Managed via Azure Container Apps secrets
- **Expiration**: 24 hours
- **Storage**: localStorage (frontend)

---

## 📊 **Data Model & Google Sheets Integration**

### **Current Data Structure**
The application currently reads from a Google Sheet with these columns:
- Customer Name
- Address
- Mobile Number
- Area
- Product
- Brand
- Model

### **Google Sheets Configuration**
- **Sheet ID**: Stored in `VITE_GOOGLE_SHEET_ID` secret
- **API Key**: Stored in `VITE_GOOGLE_API_KEY` secret
- **Caching**: 1-hour TTL with manual refresh capability
- **Rate Limiting**: 150 requests/15 minutes (production)

---

## 🚀 **Deployment & Infrastructure**

### **Azure Resources**
- **Resource Group**: `ve`
- **Container Registry**: `vinodelectronics.azurecr.io`
- **Container App**: `vinod-electronics`
- **Environment**: `vinod-electronics-env`

### **GitHub Secrets Required**
```yaml
AZURE_CREDENTIALS: '{
  "clientId": "xxx",
  "clientSecret": "xxx", 
  "tenantId": "xxx",
  "subscriptionId": "xxx"
}'
VITE_GOOGLE_SHEET_ID: "your-google-sheet-id"
VITE_GOOGLE_API_KEY: "your-google-api-key"
```

### **Deployment Workflow**
1. **Trigger**: Push to `master` branch
2. **Build**: Docker image with multi-stage build
3. **Push**: To Azure Container Registry
4. **Deploy**: Via Bicep template to Azure Container Apps
5. **Test**: Automated smoke tests

---

## 🛠️ **Development History & Key Fixes**

### **Major Issues Resolved**
1. **PWA Installation Issues** ✅
   - Fixed manifest.json configuration
   - Resolved service worker registration

2. **User Permissions** ✅  
   - Updated 'emp' user from read-only to read/write

3. **Azure Deployment Authentication Errors** ✅
   - Resolved "content already consumed" Azure CLI errors
   - Implemented robust authentication with cache clearing
   - Added fallback mechanisms

4. **Google Sheets Environment Variables** ✅
   - Fixed parameter passing from GitHub secrets to container
   - Added comprehensive debugging and health checks

5. **Bicep Template Syntax Errors** ✅
   - Fixed missing commas and formatting issues
   - Resolved parameter mismatches

### **Performance Optimizations**
- Implemented Google Sheets data caching (1-hour TTL)
- Added rate limiting for API protection
- Optimized Docker build with multi-stage builds
- Enabled compression and security headers

---

## 📁 **Key File Structure & Responsibilities**

```
search-data/
├── frontend/                    # React PWA Frontend
│   ├── src/components/         # UI Components
│   ├── src/services/          # API & Data Services  
│   ├── public/manifest.json   # PWA Configuration
│   └── public/sw.js          # Service Worker
├── backend/                   # Node.js API Server
│   ├── routes/auth.js        # Authentication endpoints
│   ├── routes/data.js        # Data search endpoints
│   ├── services/googleSheetsService.js  # Google Sheets integration
│   ├── models/User.js        # User management
│   └── middleware/           # Auth, logging, error handling
├── infrastructure/           # Azure Bicep Templates
│   ├── main.bicep           # Main infrastructure template
│   └── main.parameters.json # Environment parameters
└── .github/workflows/       # CI/CD Pipeline
    └── azure-container-apps.yml  # Deployment workflow
```

---

## 🔧 **Environment Variables**

### **Production Environment**
```bash
# Server Configuration
NODE_ENV=production
PORT=5001

# Google Sheets Integration  
GOOGLE_SHEET_ID=<from-github-secrets>
GOOGLE_API_KEY=<from-github-secrets>

# Authentication
JWT_SECRET=<auto-generated>

# Performance & Security
CACHE_TTL=3600000                    # 1 hour
DATA_REFRESH_INTERVAL=86400000       # 24 hours  
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_MAX_REQUESTS=150          # Production limit
ALLOWED_ORIGINS=https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io
```

---

## 🐛 **Troubleshooting Guide**

### **Common Issues & Solutions**

#### **1. Deployment Fails with "Content Already Consumed"**
```bash
# Solution: Clear Azure CLI cache and re-authenticate
sudo rm -rf ~/.azure
az login --service-principal --username $CLIENT_ID --password $CLIENT_SECRET --tenant $TENANT_ID
```

#### **2. Google Sheets Data Not Loading**
```bash
# Check health endpoint for environment variables
curl https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/health

# Expected response should show:
# "GOOGLE_SHEET_ID": "***SET***"
# "GOOGLE_API_KEY": "***SET***"
```

#### **3. PWA Not Installing**
- Verify manifest.json is accessible
- Check service worker registration in browser dev tools
- Ensure HTTPS is enabled (required for PWA)

#### **4. Authentication Issues** 
- Verify JWT_SECRET is set in container
- Check token expiration (24-hour limit)
- Validate user permissions in User.js model

---

## 📈 **Future Enhancement Plans**

Based on business requirements discussion:

### **Phase 1: Enhanced Data Model**
- Expand customer information capture
- Add sales transaction tracking  
- Implement purchase order management
- Include inventory management

### **Phase 2: Advanced Features**
- Multi-sheet support for different data types
- Advanced reporting and analytics
- Customer relationship management
- Financial tracking and reporting

### **Phase 3: Scalability**
- Database migration from Google Sheets
- Multi-tenant support
- Advanced caching strategies
- Performance monitoring

---

## 📝 **How to Restore Context for AI Assistant**

### **Quick Context Restoration**
When working with a new AI assistant, provide:

1. **This CONTEXT.md file** - Complete overview
2. **Current workspace structure** - Use `tree /f` command
3. **Recent changes** - Check `git log --oneline -10`
4. **Current status** - Health check endpoint results
5. **Specific issue** - Error messages or requirements

### **Essential Commands for Context**
```powershell
# Get project structure
tree /f c:\Users\vinodsharma\Personal_Workspace\search-data

# Check recent changes  
cd c:\Users\vinodsharma\Personal_Workspace\search-data
git log --oneline -10

# Verify deployment status
curl https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/health

# Check current branch and status
git status
git branch -a
```

---

## 🎯 **Success Metrics**

### **Current Application Status** ✅
- ✅ **Deployed Successfully** - Production ready on Azure
- ✅ **PWA Functional** - Installable, offline capable  
- ✅ **Authentication Working** - JWT-based secure access
- ✅ **Google Sheets Integration** - Real-time data access
- ✅ **Role-based Permissions** - Admin/Manager/Employee roles
- ✅ **CI/CD Pipeline** - Automated deployments via GitHub Actions
- ✅ **Performance Optimized** - Caching, compression, rate limiting

### **Key Performance Indicators**
- **Uptime**: 99.9% target (monitored via health endpoint)
- **Response Time**: <2 seconds for search operations
- **Data Freshness**: 1-hour cache TTL with manual refresh
- **Security**: JWT tokens, rate limiting, CORS protection

---

*This document serves as the complete context for the Vinod Electronics Search Application. Keep this updated as the application evolves.*
