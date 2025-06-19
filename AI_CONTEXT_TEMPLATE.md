# 📋 AI Assistant Context Template

Copy and paste this template when starting a new AI chat session:

---

## **Project**: Vinod Electronics Search Application

**Context Files to Review:**
1. `CONTEXT.md` - Complete project overview and technical details
2. `RESTORE_CONTEXT.md` - Quick start guide for AI assistants
3. Recent conversation summary (if available)

**Current Status:**
- ✅ **Production Ready**: Deployed at https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/
- ✅ **Health Check**: https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io/health
- ✅ **PWA Functional**: Installable app with offline support
- ✅ **Authentication Working**: JWT-based with role permissions
- ✅ **Google Sheets Integration**: Real-time data access
- ✅ **CI/CD Pipeline**: Auto-deploys from master branch

**Technology Stack:**
- Frontend: React 18 + Vite (PWA)
- Backend: Node.js + Express
- Data: Google Sheets API v4
- Hosting: Azure Container Apps
- CI/CD: GitHub Actions

**Key Recent Changes:**
- 'emp' user permissions updated to ['read', 'write']
- Production API URLs fixed (no more localhost references)
- Azure authentication issues resolved
- All deployment workflows cleaned up and working

**Common Tasks:**
- Making code changes to React frontend or Node.js backend
- Updating user permissions in `backend/models/User.js`
- Debugging deployment issues in GitHub Actions
- Adding new features or enhancing existing functionality
- Troubleshooting Google Sheets integration

**Important Notes:**
- Application uses 'master' branch (not 'main')
- All environment variables are set in Azure Container Apps
- Health endpoint provides comprehensive status information
- Documentation is kept up-to-date in CONTEXT.md

---

**Instructions for AI Assistant:**
Please review the context files mentioned above and confirm you understand the project structure before we proceed with any tasks.
