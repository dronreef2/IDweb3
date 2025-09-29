const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const Identity = require('../models/Identity');
const IPFSService = require('../services/ipfsService');
const HederaService = require('../services/hederaService');

const router = express.Router();

// Initialize services
const ipfsService = new IPFSService();
const hederaService = new HederaService();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document formats
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX'), false);
    }
  }
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Upload document
router.post('/upload', authenticateToken, upload.single('document'), [
  body('documentType')
    .isIn(['passport', 'license', 'diploma', 'certificate', 'other'])
    .withMessage('Invalid document type'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a document to upload'
      });
    }

    // Get user's identity
    const identity = await Identity.findOne({ userId: req.user._id });
    if (!identity) {
      return res.status(404).json({
        error: 'Identity not found',
        message: 'Please create a digital identity first'
      });
    }

    const { documentType, description } = req.body;

    // Upload document to IPFS
    const ipfsResult = await ipfsService.uploadDocument(
      req.file.buffer,
      req.file.originalname,
      {
        documentType,
        description,
        uploadedBy: req.user.username,
        uploadedAt: new Date().toISOString(),
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    );

    // Add document to identity
    const documentData = {
      type: documentType,
      ipfsHash: ipfsResult.hash,
      filename: req.file.originalname,
      description,
      uploadedAt: new Date(),
      verified: false
    };

    identity.metadata.documents.push(documentData);

    // Record in verification history
    identity.verificationHistory.push({
      action: 'document_uploaded',
      verifier: req.user.username,
      details: {
        documentType,
        filename: req.file.originalname,
        ipfsHash: ipfsResult.hash
      }
    });

    await identity.save();

    // Submit document upload message to Hedera topic
    const hederaMessage = {
      action: 'document_uploaded',
      identityId: identity.identityId,
      documentType,
      ipfsHash: ipfsResult.hash,
      timestamp: new Date().toISOString()
    };

    await hederaService.submitIdentityMessage(identity.hederaTopicId, hederaMessage);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        type: documentType,
        filename: req.file.originalname,
        ipfsHash: ipfsResult.hash,
        gateway: ipfsResult.gateway,
        size: req.file.size,
        uploadedAt: documentData.uploadedAt
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      error: 'Failed to upload document',
      message: error.message
    });
  }
});

// Get user's documents
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const identity = await Identity.findOne({ userId: req.user._id });
    
    if (!identity) {
      return res.status(404).json({
        error: 'Identity not found'
      });
    }

    const documents = identity.metadata.documents.map(doc => ({
      id: doc._id,
      type: doc.type,
      filename: doc.filename,
      description: doc.description,
      verified: doc.verified,
      verifiedAt: doc.verifiedAt,
      verifiedBy: doc.verifiedBy,
      uploadedAt: doc.uploadedAt,
      ipfsHash: doc.ipfsHash,
      gateway: `${process.env.IPFS_GATEWAY}${doc.ipfsHash}`
    }));

    res.json({
      documents,
      total: documents.length
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Failed to get documents',
      message: error.message
    });
  }
});

// Verify a document (admin/verifier only)
router.post('/:documentId/verify', authenticateToken, [
  body('verified')
    .isBoolean()
    .withMessage('Verified status must be boolean'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { documentId } = req.params;
    const { verified, notes } = req.body;

    // For MVP, any authenticated user can verify documents
    // In production, this should be restricted to authorized verifiers
    const identity = await Identity.findOne({
      'metadata.documents._id': documentId
    });

    if (!identity) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Find and update the document
    const document = identity.metadata.documents.id(documentId);
    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    document.verified = verified;
    document.verifiedAt = new Date();
    document.verifiedBy = req.user.username;
    if (notes) {
      document.verificationNotes = notes;
    }

    // Record in verification history
    identity.verificationHistory.push({
      action: 'document_verified',
      verifier: req.user.username,
      details: {
        documentId,
        documentType: document.type,
        verified,
        notes
      }
    });

    await identity.save();

    // Submit verification message to Hedera topic
    const hederaMessage = {
      action: 'document_verified',
      identityId: identity.identityId,
      documentId,
      verified,
      verifiedBy: req.user.username,
      timestamp: new Date().toISOString()
    };

    await hederaService.submitIdentityMessage(identity.hederaTopicId, hederaMessage);

    res.json({
      message: 'Document verification updated',
      document: {
        id: document._id,
        type: document.type,
        filename: document.filename,
        verified: document.verified,
        verifiedAt: document.verifiedAt,
        verifiedBy: document.verifiedBy,
        notes: document.verificationNotes
      }
    });

  } catch (error) {
    console.error('Document verification error:', error);
    res.status(500).json({
      error: 'Failed to verify document',
      message: error.message
    });
  }
});

// Download document
router.get('/:documentId/download', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const identity = await Identity.findOne({
      $or: [
        { userId: req.user._id }, // User can download their own documents
        // Add additional authorization logic here for verifiers
      ],
      'metadata.documents._id': documentId
    });

    if (!identity) {
      return res.status(404).json({
        error: 'Document not found or access denied'
      });
    }

    const document = identity.metadata.documents.id(documentId);
    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Get document from IPFS
    const documentBuffer = await ipfsService.getDocument(document.ipfsHash);

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    res.send(documentBuffer);

  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({
      error: 'Failed to download document',
      message: error.message
    });
  }
});

// Delete document
router.delete('/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const identity = await Identity.findOne({ userId: req.user._id });
    if (!identity) {
      return res.status(404).json({
        error: 'Identity not found'
      });
    }

    const document = identity.metadata.documents.id(documentId);
    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Remove document from array
    identity.metadata.documents.pull(documentId);

    // Record in verification history
    identity.verificationHistory.push({
      action: 'document_deleted',
      verifier: req.user.username,
      details: {
        documentId,
        documentType: document.type,
        filename: document.filename
      }
    });

    await identity.save();

    res.json({
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
});

module.exports = router;