// backend/src/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const mongoose = require('mongoose');

const app = express();

// Configurações de segurança e performance
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const FRONTEND_ORIGIN = process.env.CORS_ORIGIN || 'https://idweb3.sliplane.app';
const corsOptions = {
  origin: FRONTEND_ORIGIN,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // resposta a preflight OPTIONS

// Middleware adicional para garantir headers CORS (redundante, mas seguro)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', Array.isArray(corsOptions.origin) ? corsOptions.origin.join(',') : corsOptions.origin || '*');
  res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
  res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Conexão com MongoDB (se aplicável)
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/idweb3';
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('MongoDB connected');
  }).catch((err) => {
    console.error('MongoDB connection error:', err);
  });
}

// Exemplo de rota de healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Aqui você deve montar os routers existentes do seu projeto, por exemplo:
// const apiRouter = require('./routes/api'); app.use('/api', apiRouter);
// (Adicione suas rotas abaixo)

// Porta
const port = parseInt(process.env.PORT, 10) || 3001;
app.listen(port, () => {
  console.log(`idweb3-api listening on port ${port}`);
});
