const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const customersRoutes = require('./routes/customers');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { logger } = require('./middleware/logger');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

console.log('🔧 Environment PORT:', process.env.PORT, 'Using PORT:', PORT);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 MongoDB Config:');
console.log('   - MONGODB_URI:', process.env.MONGODB_URI ? '***SET***' : 'NOT_SET');
console.log('   - JWT_SECRET:', process.env.JWT_SECRET ? '***SET***' : 'NOT_SET');
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
        uptime: process.uptime(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            MONGODB_URI: process.env.MONGODB_URI ? '***SET***' : 'NOT_SET',
            JWT_SECRET: process.env.JWT_SECRET ? '***SET***' : 'NOT_SET'
        }
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/customers', customersRoutes);

// Serve static files in production
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

module.exports = app;
