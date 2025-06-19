# 🚀 AI Assistant Context Restoration Guide

> **Quick Start Guide for AI Assistants working on Vinod Electronics Search Application**

## 📋 **Essential Context Checklist**

When an AI assistant joins this project, follow this checklist:

### ✅ **Step 1: Read Core Documentation**
- [ ] Read `CONTEXT.md` - Complete project overview
- [ ] Read `README.md` - Technical setup instructions
- [ ] Review project structure below

### ✅ **Step 2: Verify Current Status**
- [ ] Check application health: https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/health
- [ ] Verify deployment status in Azure Container Apps
- [ ] Check recent git commits for latest changes

### ✅ **Step 3: Understand Key Components**
```
📁 Project Structure (Key Files):
├── 📄 CONTEXT.md              # Complete project context
├── 📄 README.md               # Setup instructions
├── 📄 Dockerfile              # Production build configuration
├── 📂 backend/
│   ├── 📄 server.js           # Main server with health endpoint
│   ├── 📄 models/User.js      # User management & permissions
│   ├── 📄 routes/data.js      # API routes with Google Sheets
│   └── 📄 services/googleSheetsService.js # Google Sheets integration
├── 📂 frontend/
│   ├── 📄 src/components/     # React components
│   ├── 📄 src/services/       # API services
│   └── 📄 public/manifest.json # PWA configuration
├── 📂 infrastructure/
│   ├── 📄 main.bicep          # Azure infrastructure
│   └── 📄 main.parameters.json # Deployment parameters
└── 📂 .github/workflows/
    └── 📄 azure-container-apps.yml # CI/CD pipeline
```

---

## 🔧 **Quick Reference Commands**

### **Development Commands**
```bash
# Start development
npm run dev          # Start both frontend and backend
npm run dev:frontend # Frontend only (port 3000)
npm run dev:backend  # Backend only (port 5001)

# Production
npm run build        # Build for production
npm start           # Start production server
```

### **Deployment Commands**
```bash
# Manual deployment
az login
az deployment group create --resource-group vinod-electronics-rg --template-file infrastructure/main.bicep --parameters @infrastructure/main.parameters.json

# CI/CD triggers automatically on push to master branch
```

### **Debugging Commands**
```bash
# Check application health
curl https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/health

# View logs (Azure CLI)
az containerapp logs show --name vinod-electronics --resource-group vinod-electronics-rg

# Check environment variables
curl https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/health | jq '.environment'
```

---

## 🎯 **Common Issues & Solutions**

### **Issue: PWA not installing**
- ✅ **Solution**: Check manifest.json and service worker registration
- 📍 **Files**: `frontend/public/manifest.json`, `frontend/src/sw.js`

### **Issue: Google Sheets not loading**
- ✅ **Solution**: Verify GOOGLE_SHEET_ID and GOOGLE_API_KEY environment variables
- 📍 **Check**: Health endpoint environment section

### **Issue: Authentication failures**
- ✅ **Solution**: Check JWT_SECRET environment variable and user permissions
- 📍 **Files**: `backend/models/User.js` (permissions array)

### **Issue: Deployment failures**
- ✅ **Solution**: Check GitHub Actions logs and Azure credentials
- 📍 **Files**: `.github/workflows/azure-container-apps.yml`

### **Issue: API calls to localhost in production**
- ✅ **Solution**: Verify VITE_API_BASE_URL=/api in Dockerfile
- 📍 **Files**: `Dockerfile` (ENV variables section)

---

## 📊 **Current Application State**

### **User Permissions** (Updated Recently)
```javascript
// backend/models/User.js
{
  username: 'emp',
  password: 'emp123',
  role: 'employee',
  permissions: ['read', 'write'] // ✅ Recently updated from ['read']
}
```

### **Environment Variables** (Production)
```env
NODE_ENV=production
PORT=5001
VITE_API_BASE_URL=/api
GOOGLE_SHEET_ID=***SET*** (from Azure secrets)
GOOGLE_API_KEY=***SET*** (from Azure secrets)
JWT_SECRET=***SET*** (from Azure secrets)
```

### **Recent Major Changes**
1. ✅ **Permission Fix**: 'emp' user now has write permissions
2. ✅ **Deployment Fix**: Removed conflicting Azure Static Web Apps workflows
3. ✅ **Production URLs**: Fixed localhost API calls in production
4. ✅ **Authentication**: Resolved Azure CLI "content already consumed" errors
5. ✅ **Infrastructure**: All Bicep template syntax errors resolved

---

## 🚨 **Critical Information**

### **Production URLs**
- **Main App**: https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/
- **Health Check**: https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/health
- **API Base**: https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/api

### **GitHub Repository**
- **Branch**: `master` (not main)
- **CI/CD**: Auto-deploys on push to master
- **Secrets**: AZURE_CREDENTIALS, GOOGLE_SHEET_ID, GOOGLE_API_KEY, JWT_SECRET

### **Azure Resources**
- **Resource Group**: `vinod-electronics-rg`
- **Container App**: `vinod-electronics`
- **Region**: `East US`

---

## 💡 **Tips for AI Assistants**

1. **Always check the health endpoint first** to verify current application status
2. **Use semantic_search tool** to find relevant code when making changes
3. **Read existing code before editing** to understand current implementation
4. **Test changes locally** before suggesting production deployments
5. **Update this documentation** when making significant changes
6. **Reference conversation summary** for recent context and completed tasks

---

## 📞 **Need Help?**

If you're an AI assistant working on this project and need additional context:

1. **Read the conversation summary** provided by the user
2. **Check recent git commits**: `git log --oneline -10`
3. **Verify application health** using the health endpoint
4. **Use semantic search** to find relevant code snippets
5. **Ask specific questions** about unclear requirements

---

*This guide ensures any AI assistant can quickly understand and work effectively with the Vinod Electronics Search Application.*
