import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { DatabaseService } from './utils/database';
import { errorHandler, notFoundHandler } from './middleware/error';
import apiRoutes from './routes';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Database service
const databaseService = new DatabaseService();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Add your frontend domain in production
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// API routes
app.use('/api/v1', apiRoutes);

// Serve static files
app.use(express.static('public'));

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/../public/index.html');
});

// Health check with database status
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await databaseService.healthCheck();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: NODE_ENV,
      services: {
        api: true,
        mongodb: dbHealth.mongodb,
        redis: dbHealth.redis
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, starting graceful shutdown...');
  
  try {
    await databaseService.disconnectMongoDB();
    await databaseService.disconnectRedis();
    logger.info('Database connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    await databaseService.connectMongoDB();
    await databaseService.connectRedis();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 IDweb3 server running on port ${PORT}`);
      logger.info(`📖 Environment: ${NODE_ENV}`);
      logger.info(`🔗 API Documentation: http://localhost:${PORT}/api/v1/health`);
      
      if (NODE_ENV === 'development') {
        logger.info(`🧪 Test the API at: http://localhost:${PORT}`);
      }
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          logger.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

export default app;