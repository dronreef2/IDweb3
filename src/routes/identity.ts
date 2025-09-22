import { Router } from 'express';
import { IdentityController } from '../controllers/IdentityController';
import { AuthMiddleware } from '../middleware/auth';
import { 
  validateIssueCredential, 
  validateVerifyCredential,
  handleValidationErrors 
} from '../middleware/validation';

const router = Router();
const identityController = new IdentityController();
const authMiddleware = new AuthMiddleware();

// Protected routes - require authentication
router.post('/', authMiddleware.authenticate, identityController.createIdentity);
router.get('/:identityId', authMiddleware.authenticate, identityController.getIdentity);

// Credential management
router.post('/credentials/issue', 
  authMiddleware.authenticate, 
  authMiddleware.requireIdentity,
  validateIssueCredential, 
  handleValidationErrors, 
  identityController.issueCredential
);

router.get('/credentials', 
  authMiddleware.authenticate, 
  authMiddleware.requireIdentity,
  identityController.getUserCredentials
);

router.get('/credentials/:credentialId', 
  authMiddleware.authenticate, 
  authMiddleware.requireIdentity,
  identityController.getCredential
);

// Public routes - for verification
router.post('/credentials/verify', 
  validateVerifyCredential, 
  handleValidationErrors, 
  identityController.verifyCredential
);

export default router;