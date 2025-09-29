import { Request, Response } from 'express';
import { DocumentSigningService } from '../services/DocumentSigningService';
import { APIResponse } from '../types/api';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import crypto from 'crypto';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for document signing
    cb(null, true);
  }
});

export class DocumentController {
  private documentSigningService: DocumentSigningService;
  public upload = upload;

  constructor() {
    this.documentSigningService = new DocumentSigningService();
  }

  signDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const identityId = req.user!.identityId;

    if (!identityId) {
      const response: APIResponse = {
        success: false,
        error: 'Digital identity required for document signing',
        timestamp: new Date().toISOString()
      };
      res.status(403).json(response);
      return;
    }

    let document: Buffer;
    let metadata: Record<string, any> = {};

    // Handle file upload or document hash
    if (req.file) {
      document = req.file.buffer;
      metadata = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        ...req.body.metadata
      };
    } else if (req.body.documentHash) {
      // If only hash is provided, create a placeholder document
      document = Buffer.from(req.body.documentHash, 'hex');
      metadata = req.body.metadata || {};
    } else {
      const response: APIResponse = {
        success: false,
        error: 'Document file or document hash is required',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    const signature = await this.documentSigningService.signDocument(
      identityId,
      document,
      metadata
    );

    const response: APIResponse = {
      success: true,
      data: signature,
      message: 'Document signed successfully',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  });

  verifySignature = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { signatureId } = req.params;

    const result = await this.documentSigningService.verifyDocumentSignature(signatureId);

    const response: APIResponse = {
      success: true,
      data: result,
      message: result.valid ? 'Signature is valid' : 'Signature is invalid',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });

  getUserSignatures = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const identityId = req.user!.identityId;

    if (!identityId) {
      const response: APIResponse = {
        success: false,
        error: 'Digital identity required',
        timestamp: new Date().toISOString()
      };
      res.status(403).json(response);
      return;
    }

    const signatures = await this.documentSigningService.getDocumentSignatures(identityId);

    const response: APIResponse = {
      success: true,
      data: signatures,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });

  getDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { documentHash } = req.params;

    const document = await this.documentSigningService.getDocumentByHash(documentHash);

    if (!document) {
      const response: APIResponse = {
        success: false,
        error: 'Document not found',
        timestamp: new Date().toISOString()
      };
      res.status(404).json(response);
      return;
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="document-${documentHash.substring(0, 8)}"`);
    res.send(document);
  });

  validateDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { documentHash } = req.params;

    if (!req.file) {
      const response: APIResponse = {
        success: false,
        error: 'Document file is required for validation',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    const isValid = await this.documentSigningService.validateDocumentIntegrity(
      documentHash,
      req.file.buffer
    );

    const response: APIResponse = {
      success: true,
      data: { valid: isValid },
      message: isValid ? 'Document integrity is valid' : 'Document has been modified',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });

  hashDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      const response: APIResponse = {
        success: false,
        error: 'Document file is required',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    const response: APIResponse = {
      success: true,
      data: {
        hash,
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      },
      message: 'Document hash calculated successfully',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });
}