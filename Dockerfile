# Multi-stage Dockerfile for monorepo deployment with npm workspaces
# Build stage for frontend
FROM node:18 AS frontend-build
WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies for all workspaces
RUN npm install

# Copy frontend source and build
COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

# Build stage for backend
FROM node:18 AS backend-build
WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install only production dependencies
RUN npm install --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Production stage
FROM node:18 AS production
WORKDIR /app

# Copy backend files and node_modules from backend build
COPY --from=backend-build /app/backend ./backend
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/package*.json ./

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
