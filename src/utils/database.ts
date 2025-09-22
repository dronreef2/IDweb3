import mongoose from 'mongoose';
import redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'database.log' })
  ]
});

export class DatabaseService {
  private redisClient: any;

  async connectMongoDB(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/idweb3';
      
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info('Connected to MongoDB successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async connectRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redisClient = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      });

      this.redisClient.on('error', (error: any) => {
        logger.error('Redis connection error:', error);
      });

      this.redisClient.on('connect', () => {
        logger.info('Connected to Redis successfully');
      });

      this.redisClient.on('reconnecting', () => {
        logger.info('Reconnecting to Redis...');
      });

      await this.redisClient.connect();

    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnectMongoDB(): Promise<void> {
    try {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  async disconnectRedis(): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        logger.info('Disconnected from Redis');
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  getRedisClient() {
    return this.redisClient;
  }

  async healthCheck(): Promise<{
    mongodb: boolean;
    redis: boolean;
  }> {
    const health = {
      mongodb: false,
      redis: false
    };

    try {
      // Check MongoDB
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.admin().ping();
        health.mongodb = true;
      }
    } catch (error) {
      logger.error('MongoDB health check failed:', error);
    }

    try {
      // Check Redis
      if (this.redisClient && this.redisClient.isReady) {
        await this.redisClient.ping();
        health.redis = true;
      }
    } catch (error) {
      logger.error('Redis health check failed:', error);
    }

    return health;
  }
}