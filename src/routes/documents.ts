import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { AuthMiddleware } from '../middleware/auth';
import { 
  validateSignDocument, 
  handleValidationErrors 
} from '../middleware/validation';

const router = Router();
const documentController = new DocumentController();
const authMiddleware = new AuthMiddleware();

// Document signing (requires authentication and identity)
router.post('/sign', 
  authMiddleware.authenticate, 
  authMiddleware.requireIdentity,
  documentController.upload.single('document'),
  documentController.signDocument
);

// Get user's signatures
router.get('/signatures', 
  authMiddleware.authenticate, 
  authMiddleware.requireIdentity,
  documentController.getUserSignatures
);

// Document utilities
router.post('/hash', 
  documentController.upload.single('document'),
  documentController.hashDocument
);

// Public verification routes
router.get('/signatures/:signatureId/verify', documentController.verifySignature);
router.get('/documents/:documentHash', documentController.getDocument);
router.post('/documents/:documentHash/validate', 
  documentController.upload.single('document'),
  documentController.validateDocument
);

export default router;