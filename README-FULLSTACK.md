# PWA Google Sheets Search - Full Stack Application

This project has been transformed from a frontend-only application to a secure full-stack application with proper authentication, server-side data management, and role-based access control.

## 🚀 New Architecture

### Backend Features
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Role-Based Access Control**: Admin, Manager, and Employee roles with different permissions
- **Server-Side API**: Secure Google Sheets API integration on the backend
- **Pagination & Search**: Server-side search and pagination for better performance
- **Caching**: Intelligent server-side caching with automatic refresh
- **Rate Limiting**: API rate limiting for security
- **Input Validation**: Comprehensive input validation and sanitization

### Frontend Updates
- **Secure API Integration**: Frontend now communicates with backend API
- **JWT Token Management**: Automatic token refresh and secure storage
- **Role-Based UI**: Different UI elements based on user permissions
- **Better Error Handling**: Comprehensive error handling and user feedback

## 🔧 Setup Instructions

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Install Backend Dependencies
```bash
npm run server:install
```

### 3. Configure Environment Variables

#### Backend Configuration (`server/.env`)
```env
NODE_ENV=development
PORT=5000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Google Sheets API Configuration
GOOGLE_SHEET_ID=your-google-sheet-id
GOOGLE_API_KEY=your-google-api-key

# Cache Configuration
CACHE_TTL=3600000
DATA_REFRESH_INTERVAL=86400000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4173,http://localhost:5173
```

#### Frontend Configuration (`.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Vinod Electronics Search
VITE_APP_VERSION=2.0.0
```

### 4. Start the Application

#### Option 1: Start Both Frontend and Backend Together
```bash
npm run dev:both
```

#### Option 2: Start Separately
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev
```

## 🔐 User Accounts & Roles

### Admin User
- **Username**: `jagdishsharma`
- **Password**: `jagdish123`
- **Permissions**: Read, Write, Delete (can refresh cache, clear cache)

### Manager User
- **Username**: `vinodsharma`
- **Password**: `vinod123`
- **Permissions**: Read, Write (can refresh cache)

### Employee User
- **Username**: `emp`
- **Password**: `emp123`
- **Permissions**: Read only (can only search data)

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Data Management
- `GET /api/data/search` - Search data with pagination
- `GET /api/data/stats` - Get data statistics
- `POST /api/data/refresh` - Refresh data cache (requires write permission)
- `DELETE /api/data/cache` - Clear cache (requires delete permission)
- `GET /api/data/cache/info` - Get cache information

## 🔒 Security Improvements

### What's Fixed
1. **Exposed API Keys**: Google API keys now secured on backend
2. **Client-side Authentication**: Replaced with proper JWT authentication
3. **Hardcoded Credentials**: Passwords now hashed with bcrypt
4. **No Session Management**: Proper JWT token management with expiry
5. **Client-side Data Storage**: Data now properly managed on server
6. **No Access Control**: Role-based permissions implemented

### Security Features
- **Password Hashing**: All passwords stored as bcrypt hashes
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive validation for all inputs
- **CORS Protection**: Proper CORS configuration
- **Error Handling**: Secure error messages without sensitive data exposure

## 📊 Performance Improvements

1. **Server-side Pagination**: Only load what's needed
2. **Intelligent Caching**: Server-side caching with automatic refresh
3. **Reduced Client Storage**: No more large datasets in browser
4. **API Optimization**: Efficient search and filtering on server
5. **Memory Management**: Better memory usage on client side

## 🚀 Production Deployment

### Environment Variables for Production
Make sure to update these for production:
- Change `JWT_SECRET` to a strong, random secret
- Update `ALLOWED_ORIGINS` to your production domain
- Set `NODE_ENV=production`
- Use secure, unique API keys

### Recommended Hosting
- **Backend**: Deploy to services like Railway, Render, or Heroku
- **Frontend**: Deploy to Vercel, Netlify, or Azure Static Web Apps
- **Database**: Consider moving to a real database (PostgreSQL, MongoDB) for production

## 📝 Development Notes

### Backend Structure
```
server/
├── middleware/          # Authentication, error handling, logging
├── models/             # User model (ready for database integration)
├── routes/             # API routes for auth and data
├── services/           # Google Sheets service with caching
├── .env               # Environment configuration
└── server.js          # Main server file
```

### Key Features
- **Modular Architecture**: Easy to extend and maintain
- **Database Ready**: User model ready for database integration
- **Scalable Caching**: Server-side caching with configurable TTL
- **Comprehensive Logging**: Request logging and error tracking
- **Security First**: Multiple layers of security protection

## 🔄 Migration Benefits

1. **Scalability**: Can handle much larger datasets
2. **Security**: Proper authentication and authorization
3. **Performance**: Server-side processing and caching
4. **Maintainability**: Clean separation of concerns
5. **Professional**: Enterprise-ready architecture
