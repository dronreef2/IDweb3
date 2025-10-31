require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.APP_PORT || 3001;
const HOST = '0.0.0.0';

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    process.env.FRONTEND_URL : 
    ['http://localhost:3000', 'http://localhost:3003'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('combined'));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'IDweb3 API is running',
    timestamp: new Date().toISOString(),
    service: 'IDweb3 API',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'IDweb3 API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/*', (req, res) => {
  res.status(503).json({
    message: 'API endpoints are currently unavailable',
    reason: 'Database connections not configured'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
