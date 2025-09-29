import { Router } from 'express';
import authRoutes from './auth';
import identityRoutes from './identity';
import documentRoutes from './documents';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/identity', identityRoutes);
router.use('/documents', documentRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'IDweb3 API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;