# Multi-stage Dockerfile for monorepo deployment
# Build stage for frontend
FROM node:18 as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build stage for backend
FROM node:18 as backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Production stage
FROM node:18 as production
WORKDIR /app

# Copy backend files
COPY --from=backend-build /app/backend ./backend
WORKDIR /app/backend

# Copy frontend build to serve as static files
COPY --from=frontend-build /app/frontend/dist ./public

# Install serve to handle static files and API routing
RUN npm install -g serve

# Create startup script
RUN echo '#!/bin/sh\n\
echo "🚀 Starting production server..."\n\
echo "📁 Serving frontend from: /app/backend/public"\n\
echo "🔧 Backend API on port: $PORT"\n\
node server.js' > start.sh && chmod +x start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5001) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE $PORT

CMD ["./start.sh"]
