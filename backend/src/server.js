require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Database connections commented out - server will run without them
// const connectDB = require('./config/database');
// const connectRedis = require('./config/redis');

// Route imports commented out until DB is configured
// const authRoutes = require('./routes/auth');
// const identityRoutes = require('./routes/identity');
// const credentialRoutes = require('./routes/credentials');
// const documentRoutes = require('./routes/documents');
// const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.APP_PORT || 3001;
const HOST = '0.0.0.0';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    process.env.FRONTEND_URL : 
    ['http://localhost:3000', 'http://localhost:3003'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Root endpoint - for healthcheck
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'IDweb3 API is running',
    timestamp: new Date().toISOString(),
    service: 'IDweb3 API',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'IDweb3 API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes - temporarily unavailable until DB is configured
app.use('/api/*', (req, res) => {
  res.status(503).json({
    message: 'API endpoints are currently unavailable',
    reason: 'Database connections not configured',
    status: 'Server is running but needs MongoDB and Redis to be configured'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res

