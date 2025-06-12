# Production Deployment Guide

## Environment Variables Configuration

### Backend (.env)
```env
NODE_ENV=production
PORT=5000

# JWT Configuration - CHANGE THESE IN PRODUCTION
JWT_SECRET=your-production-super-secret-jwt-key-256-bits-long
JWT_EXPIRES_IN=24h

# Google Sheets API Configuration
GOOGLE_SHEET_ID=your-actual-sheet-id
GOOGLE_API_KEY=your-actual-api-key

# Cache Configuration (1 hour cache, refresh daily)
CACHE_TTL=3600000
DATA_REFRESH_INTERVAL=86400000

# Rate Limiting (15 minutes window, 100 requests max)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

## Security Checklist

### 🔒 Critical Security Updates
- [ ] Change JWT_SECRET to a cryptographically secure 256-bit key
- [ ] Update CORS allowed origins to your production domains
- [ ] Enable HTTPS for both frontend and backend
- [ ] Set secure cookie settings for production
- [ ] Configure reverse proxy (nginx/Apache) with security headers
- [ ] Set up firewall rules to restrict database access
- [ ] Enable request logging and monitoring

### 🗃️ Database Migration
Replace the in-memory user store with a proper database:

```javascript
// Recommended: PostgreSQL with proper schema
const users = {
  id: 'SERIAL PRIMARY KEY',
  username: 'VARCHAR(50) UNIQUE NOT NULL',
  email: 'VARCHAR(100) UNIQUE NOT NULL', 
  password: 'VARCHAR(255) NOT NULL', // bcrypt hash
  role: 'ENUM(admin, manager, employee)',
  permissions: 'JSON',
  isActive: 'BOOLEAN DEFAULT TRUE',
  createdAt: 'TIMESTAMP DEFAULT NOW()',
  lastLogin: 'TIMESTAMP'
}
```

## Deployment Architecture

### Recommended Stack
```
[Load Balancer] 
    ↓
[Reverse Proxy (nginx)]
    ↓
[Node.js Backend] ←→ [PostgreSQL Database]
    ↓
[Static Frontend] (CDN)
```

### Docker Configuration

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

#### Frontend Dockerfile  
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### Docker Compose (Production)
```yaml
version: '3.8'
services:
  backend:
    build: ./server
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/searchapp
    depends_on:
      - db
    
  frontend:
    build: .
    ports:
      - "80:80"
      - "443:443"
    
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=searchapp
      - POSTGRES_USER=appuser
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Performance Optimization

### Backend Optimizations
- Enable gzip compression
- Set up Redis for session storage and caching
- Configure connection pooling for database
- Implement query optimization and indexing
- Add API response caching headers

### Frontend Optimizations  
- Enable PWA caching strategies
- Implement code splitting and lazy loading
- Configure CDN for static assets
- Enable browser caching
- Minimize bundle size

## Monitoring & Logging

### Backend Monitoring
```javascript
// Add to server.js
import winston from 'winston';
import morgan from 'morgan';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

app.use(morgan('combined', { stream: { write: message => logger.info(message) } }));
```

### Health Checks
```javascript
// Enhanced health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabaseConnection(),
    googleSheets: await checkGoogleSheetsConnection()
  };
  res.json(health);
});
```

## CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          # Your deployment commands
          docker-compose -f docker-compose.prod.yml up -d
```

## SSL/HTTPS Configuration

### Let's Encrypt with nginx
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

## Backup Strategy

### Database Backups
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump searchapp > "backup_${DATE}.sql"
aws s3 cp "backup_${DATE}.sql" s3://your-backup-bucket/
```

### Configuration Backups
- Environment variables
- SSL certificates  
- nginx configuration
- Docker configurations

## Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Session storage (Redis)
- Database read replicas
- CDN for static assets

### Monitoring Metrics
- Response times
- Error rates
- Database performance
- Memory/CPU usage
- User authentication patterns

## Post-Deployment Testing

### Automated Tests
```bash
# API endpoint tests
curl -f https://your-domain.com/health
curl -f https://your-domain.com/api/auth/login -X POST -d '{"username":"test","password":"test"}'

# Frontend tests  
curl -f https://your-domain.com/
```

### Performance Testing
- Load testing with tools like Artillery or k6
- Database query performance
- Cache hit rates
- API response times

**Status**: Ready for production deployment with proper security, monitoring, and scaling considerations.
