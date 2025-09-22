import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middleware/auth';
import { 
  validateRegister, 
  validateLogin, 
  handleValidationErrors 
} from '../middleware/validation';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes
router.post('/register', validateRegister, handleValidationErrors, authController.register);
router.post('/login', validateLogin, handleValidationErrors, authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/profile', authMiddleware.authenticate, authController.getProfile);
router.put('/profile', authMiddleware.authenticate, authController.updateProfile);
router.post('/change-password', authMiddleware.authenticate, authController.changePassword);

export default router;