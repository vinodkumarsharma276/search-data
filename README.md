# Vinod Electronics Search Application

A full-stack Progressive Web App (PWA) for searching electronics inventory data. Built with React frontend, Node.js backend, and deployed on Azure Container Apps.

## 🌐 Live Application

- **Production**: https://vinod-electronics.kindplant-cbf8e6ac.eastus.azurecontainerapps.io
- **Staging**: https://vinod-electronics-staging.redbay-00742d68.eastus.azurecontainerapps.io

## ✨ Features

- **Progressive Web App**: Installable on mobile devices with native app experience
- **User Authentication**: Secure JWT-based authentication
  - Username: `jagdishchand`, Password: `jagdish123`
  - Username: `vinodsharma`, Password: `vinod123`
- **Real-time Search**: Fast search through electronics inventory data
- **Dynamic Filtering**: Filter by name, address, phone, and other criteria
- **Responsive Design**: Optimized for desktop and mobile devices
- **Offline Support**: PWA capabilities for offline functionality

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 18 with Vite
- **UI Components**: Custom responsive components
- **PWA Features**: Service workers, manifest, offline support
- **State Management**: React hooks and context
- **Authentication**: JWT token management

### Backend (Node.js + Express)
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Authentication**: JWT with bcrypt
- **API**: RESTful endpoints
- **Data Source**: Google Sheets API integration
- **Middleware**: CORS, rate limiting, logging

### Infrastructure
- **Hosting**: Azure Container Apps
- **Container Registry**: Azure Container Registry
- **CI/CD**: GitHub Actions
- **Infrastructure as Code**: Azure Bicep templates

## 📁 Project Structure

```
search-data/
├── frontend/                 # React PWA frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API and data services
│   │   ├── hooks/           # Custom React hooks
│   │   └── styles/          # CSS stylesheets
│   ├── public/              # Static assets and PWA files
│   └── package.json
├── backend/                 # Node.js API server
│   ├── routes/              # Express routes
│   ├── middleware/          # Custom middleware
│   ├── services/            # Business logic
│   ├── models/              # Data models
│   └── package.json
├── infrastructure/          # Azure Bicep templates
│   ├── main.bicep
│   ├── main.parameters.json
│   └── staging.parameters.json
├── scripts/                 # Deployment and utility scripts
├── .github/workflows/       # CI/CD pipelines
└── Dockerfile              # Multi-stage container build
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- Docker (for containerization)
- Azure CLI (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd search-data
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development servers**
   ```bash
   # Frontend (http://localhost:5173)
   cd frontend && npm run dev
   
   # Backend (http://localhost:5001)
   cd backend && npm run dev
   ```

### Docker Development

1. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

## 🔧 Environment Configuration

### Backend Environment Variables
```env
NODE_ENV=development|staging|production
PORT=5001
JWT_SECRET=your-jwt-secret
GOOGLE_SHEET_ID=your-google-sheet-id
GOOGLE_API_KEY=your-google-api-key
CACHE_TTL=3600000
DATA_REFRESH_INTERVAL=86400000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=http://localhost:5173
```

## 🐳 Docker

### Build and Run
```bash
# Build the container
docker build -t vinod-electronics .

# Run the container
docker run -p 5001:5001 vinod-electronics
```

### Multi-stage Build
The Dockerfile uses a multi-stage build:
1. **Frontend Build**: Compiles React app with Vite
2. **Backend Build**: Prepares Node.js server with dependencies
3. **Production**: Combines frontend build with backend server

## ☁️ Azure Deployment

### Automated Deployment (GitHub Actions)
- **Push to main**: Deploys to production
- **Pull requests**: Deploys to staging
- **Manual**: Can be triggered via GitHub Actions

### Manual Deployment
```bash
# Deploy to staging
./scripts/deploy-azure.ps1 -Environment staging

# Deploy to production  
./scripts/deploy-azure.ps1 -Environment production
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# Docker testing
./scripts/test-docker.ps1

# Local testing
./scripts/test-local.ps1
```
│   │   ├── authService.js
│   │   └── googleSheetsService.js
│   ├── hooks
│   │   └── useAuth.js
│   ├── utils
│   │   └── constants.js
│   ├── styles
│   │   └── App.css
│   ├── App.js
│   └── index.js
├── package.json
├── .env
└── README.md
```

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd pwa-google-sheets-search
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ## 📝 API Endpoints

### Authentication
```
POST /api/auth/login    # User login
POST /api/auth/verify   # Verify JWT token
```

### Data
```
GET /api/data/search    # Search inventory data
GET /health            # Health check endpoint
```

## 🔐 Security

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse (100-150 requests per 15 minutes)
- **CORS Configuration**: Environment-specific origins
- **Input Validation**: Server-side validation and sanitization
- **Environment Secrets**: Secure secret management

## 🚀 Performance

- **Caching**: 1-hour cache for search results
- **Data Refresh**: Daily automatic data refresh
- **Auto-scaling**: Based on CPU and HTTP load
- **CDN Ready**: Static assets optimized for CDN delivery

## 🏥 Monitoring & Health

- **Health Checks**: `/health` endpoint for monitoring
- **Logging**: Structured logging with Azure Monitor
- **Performance Metrics**: Built-in Container Apps metrics
- **Uptime Monitoring**: Automated health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Test locally: `npm test`
5. Commit changes: `git commit -am 'Add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check the logs in Azure Portal
- Review the health endpoint: `/health`

---

**Built with ❤️ for Vinod Electronics**