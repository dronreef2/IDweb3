const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const Identity = require('../models/Identity');
const Credential = require('../models/Credential');
const HederaService = require('../services/hederaService');
const GuardianService = require('../services/guardianService');
const IPFSService = require('../services/ipfsService');

const router = express.Router();

// Initialize services
const hederaService = new HederaService();
const guardianService = new GuardianService();
const ipfsService = new IPFSService();

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

// Issue a new credential
router.post('/issue', authenticateToken, [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('type')
    .isIn([
      'identity_verification',
      'educational_credential',
      'professional_license',
      'government_id',
      'medical_record',
      'financial_verification',
      'custom'
    ])
    .withMessage('Invalid credential type'),
  body('subject')
    .notEmpty()
    .withMessage('Credential subject is required'),
  body('expirationDate')
    .optional()
    .isISO8601()
    .withMessage('Valid expiration date required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId, type, subject, expirationDate, customAttributes } = req.body;

    // Get target user's identity
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        error: 'Target user not found'
      });
    }

    const identity = await Identity.findOne({ userId });
    if (!identity) {
      return res.status(404).json({
        error: 'Identity not found',
        message: 'Target user must have a digital identity'
      });
    }

    // For MVP, allow any authenticated user to issue credentials
    // In production, restrict to authorized issuers
    const credentialId = uuidv4();
    const issuanceDate = new Date();
    const expDate = expirationDate ? new Date(expirationDate) : null;

    // Create verifiable credential data
    const credentialData = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1'
      ],
      type: ['VerifiableCredential', type],
      issuer: {
        id: `did:hedera:testnet:${req.user._id}`,
        name: req.user.fullName,
        username: req.user.username
      },
      issuanceDate: issuanceDate.toISOString(),
      expirationDate: expDate ? expDate.toISOString() : null,
      credentialSubject: {
        id: identity.guardianDID || `did:hedera:testnet:${userId}`,
        ...subject,
        ...customAttributes
      },
      proof: {
        type: 'HederaSignature2023',
        created: issuanceDate.toISOString(),
        verificationMethod: `did:hedera:testnet:${req.user._id}#key-1`,
        proofPurpose: 'assertionMethod'
      }
    };

    // Upload credential to IPFS
    const ipfsResult = await ipfsService.uploadJSON(credentialData);

    // Submit credential to Hedera topic
    const hederaMessage = {
      action: 'credential_issued',
      credentialId,
      identityId: identity.identityId,
      type,
      issuer: req.user.username,
      subject: targetUser.username,
      ipfsHash: ipfsResult.hash,
      timestamp: issuanceDate.toISOString()
    };

    const sequenceNumber = await hederaService.submitIdentityMessage(
      identity.hederaTopicId,
      hederaMessage
    );

    // Create credential record
    const credential = new Credential({
      credentialId,
      userId,
      identityId: identity._id,
      type,
      issuer: {
        name: req.user.fullName,
        did: `did:hedera:testnet:${req.user._id}`,
        address: req.user.email,
        publicKey: 'hedera-public-key-placeholder'
      },
      subject: {
        did: identity.guardianDID || `did:hedera:testnet:${userId}`,
        attributes: { ...subject, ...customAttributes }
      },
      credentialData,
      hederaTopicId: identity.hederaTopicId,
      hederaMessageSequence: sequenceNumber,
      ipfsHash: ipfsResult.hash,
      status: 'active',
      issuanceMethod: 'manual'
    });

    await credential.save();

    // Add credential to identity
    identity.credentialsIssued.push(credential._id);
    identity.verificationHistory.push({
      action: 'credential_issued',
      verifier: req.user.username,
      details: {
        credentialId,
        type,
        ipfsHash: ipfsResult.hash
      }
    });

    await identity.save();

    // Try to register with Guardian
    try {
      const guardianCredential = await guardianService.createCredential({
        type,
        subject: credentialData.credentialSubject,
        issuer: credentialData.issuer,
        data: credentialData
      });
      
      credential.guardianCredentialId = guardianCredential.id;
      await credential.save();
    } catch (guardianError) {
      console.warn('Guardian credential creation failed:', guardianError.message);
    }

    res.status(201).json({
      message: 'Credential issued successfully',
      credential: {
        credentialId: credential.credentialId,
        type: credential.type,
        status: credential.status,
        issuer: credential.issuer.name,
        subject: targetUser.username,
        issuanceDate: credentialData.issuanceDate,
        expirationDate: credentialData.expirationDate,
        ipfsHash: credential.ipfsHash,
        hederaTopicId: credential.hederaTopicId,
        hederaMessageSequence: credential.hederaMessageSequence
      }
    });

  } catch (error) {
    console.error('Credential issuance error:', error);
    res.status(500).json({
      error: 'Failed to issue credential',
      message: error.message
    });
  }
});

// Get user's credentials
router.get('/my-credentials', authenticateToken, async (req, res) => {
  try {
    const credentials = await Credential.find({ 
      userId: req.user._id,
      isActive: true 
    }).sort({ createdAt: -1 });

    const credentialList = credentials.map(cred => ({
      credentialId: cred.credentialId,
      type: cred.type,
      status: cred.status,
      issuer: cred.issuer.name,
      issuanceDate: cred.credentialData.issuanceDate,
      expirationDate: cred.credentialData.expirationDate,
      isExpired: cred.isExpired(),
      isValid: cred.isValid(),
      verificationsCount: cred.verifications.length,
      usageCount: cred.usage.length,
      ipfsHash: cred.ipfsHash,
      createdAt: cred.createdAt
    }));

    res.json({
      credentials: credentialList,
      total: credentialList.length,
      active: credentialList.filter(c => c.isValid).length,
      expired: credentialList.filter(c => c.isExpired).length
    });

  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({
      error: 'Failed to get credentials',
      message: error.message
    });
  }
});

// Get credential details
router.get('/:credentialId', authenticateToken, async (req, res) => {
  try {
    const { credentialId } = req.params;

    const credential = await Credential.findOne({ 
      credentialId,
      $or: [
        { userId: req.user._id }, // User can view their own credentials
        { 'issuer.did': `did:hedera:testnet:${req.user._id}` } // Issuer can view issued credentials
      ]
    }).populate('userId', 'username fullName email')
      .populate('identityId');

    if (!credential) {
      return res.status(404).json({
        error: 'Credential not found or access denied'
      });
    }

    res.json({
      credential: {
        credentialId: credential.credentialId,
        type: credential.type,
        status: credential.status,
        issuer: credential.issuer,
        subject: credential.subject,
        credentialData: credential.credentialData,
        issuanceMethod: credential.issuanceMethod,
        isExpired: credential.isExpired(),
        isValid: credential.isValid(),
        verifications: credential.verifications,
        usage: credential.usage,
        metadata: credential.metadata,
        hederaTopicId: credential.hederaTopicId,
        hederaMessageSequence: credential.hederaMessageSequence,
        ipfsHash: credential.ipfsHash,
        guardianCredentialId: credential.guardianCredentialId,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt
      }
    });

  } catch (error) {
    console.error('Get credential error:', error);
    res.status(500).json({
      error: 'Failed to get credential',
      message: error.message
    });
  }
});

// Verify a credential
router.post('/:credentialId/verify', authenticateToken, [
  body('verificationMethod')
    .optional()
    .isIn(['manual', 'automated', 'blockchain'])
    .withMessage('Invalid verification method'),
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

    const { credentialId } = req.params;
    const { verificationMethod = 'manual', notes } = req.body;

    const credential = await Credential.findOne({ credentialId });
    if (!credential) {
      return res.status(404).json({
        error: 'Credential not found'
      });
    }

    // Add verification record
    const verificationInfo = {
      id: req.user._id,
      name: req.user.fullName,
      method: verificationMethod,
      notes
    };

    await credential.verify(verificationInfo);

    // Submit verification to Hedera
    const hederaMessage = {
      action: 'credential_verified',
      credentialId,
      verifier: req.user.username,
      verificationMethod,
      timestamp: new Date().toISOString()
    };

    await hederaService.submitIdentityMessage(
      credential.hederaTopicId,
      hederaMessage
    );

    res.json({
      message: 'Credential verified successfully',
      verification: {
        verifier: req.user.fullName,
        method: verificationMethod,
        timestamp: new Date(),
        notes
      }
    });

  } catch (error) {
    console.error('Credential verification error:', error);
    res.status(500).json({
      error: 'Failed to verify credential',
      message: error.message
    });
  }
});

// Revoke a credential
router.post('/:credentialId/revoke', authenticateToken, [
  body('reason')
    .notEmpty()
    .withMessage('Revocation reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { credentialId } = req.params;
    const { reason } = req.body;

    const credential = await Credential.findOne({ 
      credentialId,
      'issuer.did': `did:hedera:testnet:${req.user._id}` // Only issuer can revoke
    });

    if (!credential) {
      return res.status(404).json({
        error: 'Credential not found or unauthorized'
      });
    }

    if (credential.status === 'revoked') {
      return res.status(400).json({
        error: 'Credential already revoked'
      });
    }

    await credential.revoke(reason);

    // Submit revocation to Hedera
    const hederaMessage = {
      action: 'credential_revoked',
      credentialId,
      revokedBy: req.user.username,
      reason,
      timestamp: new Date().toISOString()
    };

    await hederaService.submitIdentityMessage(
      credential.hederaTopicId,
      hederaMessage
    );

    res.json({
      message: 'Credential revoked successfully',
      credentialId,
      reason,
      revokedAt: new Date()
    });

  } catch (error) {
    console.error('Credential revocation error:', error);
    res.status(500).json({
      error: 'Failed to revoke credential',
      message: error.message
    });
  }
});

// Record credential usage
router.post('/:credentialId/usage', authenticateToken, [
  body('purpose')
    .notEmpty()
    .withMessage('Usage purpose is required'),
  body('application')
    .notEmpty()
    .withMessage('Application name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { credentialId } = req.params;
    const { purpose, application } = req.body;

    const credential = await Credential.findOne({ credentialId });
    if (!credential) {
      return res.status(404).json({
        error: 'Credential not found'
      });
    }

    if (!credential.isValid()) {
      return res.status(400).json({
        error: 'Credential is not valid',
        message: 'Cannot use an invalid, revoked, or expired credential'
      });
    }

    // Record usage
    const usageInfo = {
      usedBy: req.user.username,
      purpose,
      application
    };

    await credential.recordUsage(usageInfo);

    res.json({
      message: 'Credential usage recorded',
      usage: {
        usedBy: req.user.username,
        purpose,
        application,
        usedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Credential usage error:', error);
    res.status(500).json({
      error: 'Failed to record usage',
      message: error.message
    });
  }
});

module.exports = router;