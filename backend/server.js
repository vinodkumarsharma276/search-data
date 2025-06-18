import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { logger } from './middleware/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Get dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Environment PORT:', process.env.PORT, 'Using PORT:', PORT);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('📁 Static files directory:', path.join(__dirname, 'public'));

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(logger);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const staticPath = path.join(__dirname, 'public');
    console.log('🌐 Serving static files from:', staticPath);
    
    // Serve static files
    app.use(express.static(staticPath));
      // Handle React routing - serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
        // Skip API routes and health check
        if (req.path.startsWith('/api/') || req.path === '/health') {
            return next();
        }
        
        const indexPath = path.join(staticPath, 'index.html');
        console.log('📄 Serving index.html for:', req.path);
        res.sendFile(indexPath);
    });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server  
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});

export default app;
