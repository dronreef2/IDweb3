const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const Identity = require('../models/Identity');
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

// Create new identity
router.post('/create', authenticateToken, [
  body('personalInfo.firstName').notEmpty().withMessage('First name is required'),
  body('personalInfo.lastName').notEmpty().withMessage('Last name is required'),
  body('personalInfo.dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('personalInfo.nationality').notEmpty().withMessage('Nationality is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if user already has an identity
    const existingIdentity = await Identity.findOne({ userId: req.user._id });
    if (existingIdentity) {
      return res.status(409).json({
        error: 'Identity already exists',
        message: 'User already has a digital identity'
      });
    }

    const { personalInfo, documents = [] } = req.body;
    const identityId = uuidv4();

    // Create Hedera topic for this identity
    const topicId = await hederaService.createIdentityTopic(
      `Identity for ${req.user.username} - ${identityId}`
    );

    // Prepare identity metadata
    const identityMetadata = {
      identityId,
      userId: req.user._id,
      personalInfo,
      documents,
      createdAt: new Date().toISOString(),
      version: '1.0'
    };

    // Upload metadata to IPFS
    const ipfsResult = await ipfsService.uploadJSON(identityMetadata);

    // Submit initial identity message to Hedera topic
    const hederaMessage = {
      action: 'identity_created',
      identityId,
      userId: req.user._id.toString(),
      ipfsHash: ipfsResult.hash,
      timestamp: new Date().toISOString()
    };

    await hederaService.submitIdentityMessage(topicId, hederaMessage);

    // Create identity record in database
    const identity = new Identity({
      userId: req.user._id,
      identityId,
      hederaTopicId: topicId,
      metadata: {
        personalInfo,
        documents
      },
      ipfsMetadataHash: ipfsResult.hash,
      status: 'pending'
    });

    await identity.save();

    // Register user in Guardian (if configured)
    try {
      const guardianUser = await guardianService.registerUser({
        username: req.user.username,
        email: req.user.email,
        role: 'USER'
      });
      
      identity.guardianDID = guardianUser.did;
      await identity.save();
    } catch (guardianError) {
      console.warn('Guardian registration failed:', guardianError.message);
    }

    res.status(201).json({
      message: 'Digital identity created successfully',
      identity: {
        identityId: identity.identityId,
        status: identity.status,
        hederaTopicId: identity.hederaTopicId,
        ipfsHash: identity.ipfsMetadataHash,
        guardianDID: identity.guardianDID,
        createdAt: identity.createdAt
      }
    });

  } catch (error) {
    console.error('Identity creation error:', error);
    res.status(500).json({
      error: 'Failed to create identity',
      message: error.message
    });
  }
});

// Get user's identity
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const identity = await Identity.findOne({ userId: req.user._id })
      .populate('credentialsIssued');

    if (!identity) {
      return res.status(404).json({
        error: 'Identity not found',
        message: 'No digital identity found for this user'
      });
    }

    res.json({
      identity: {
        identityId: identity.identityId,
        status: identity.status,
        verificationLevel: identity.verificationLevel,
        hederaTopicId: identity.hederaTopicId,
        hederaNFTTokenId: identity.hederaNFTTokenId,
        guardianDID: identity.guardianDID,
        metadata: identity.metadata,
        credentialsCount: identity.credentialsIssued.length,
        verificationHistory: identity.verificationHistory,
        isActive: identity.isActive,
        createdAt: identity.createdAt,
        updatedAt: identity.updatedAt
      }
    });

  } catch (error) {
    console.error('Get identity error:', error);
    res.status(500).json({
      error: 'Failed to get identity',
      message: error.message
    });
  }
});

// Update identity information
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const identity = await Identity.findOne({ userId: req.user._id });
    
    if (!identity) {
      return res.status(404).json({
        error: 'Identity not found'
      });
    }

    const { personalInfo, documents } = req.body;

    // Update metadata
    if (personalInfo) {
      identity.metadata.personalInfo = { ...identity.metadata.personalInfo, ...personalInfo };
    }

    if (documents) {
      identity.metadata.documents = documents;
    }

    // Upload updated metadata to IPFS
    const updatedMetadata = {
      identityId: identity.identityId,
      userId: req.user._id,
      personalInfo: identity.metadata.personalInfo,
      documents: identity.metadata.documents,
      updatedAt: new Date().toISOString(),
      version: '1.1'
    };

    const ipfsResult = await ipfsService.uploadJSON(updatedMetadata);
    identity.ipfsMetadataHash = ipfsResult.hash;

    // Submit update message to Hedera topic
    const hederaMessage = {
      action: 'identity_updated',
      identityId: identity.identityId,
      ipfsHash: ipfsResult.hash,
      timestamp: new Date().toISOString()
    };

    await hederaService.submitIdentityMessage(identity.hederaTopicId, hederaMessage);

    // Add to verification history
    identity.verificationHistory.push({
      action: 'identity_updated',
      verifier: req.user.username,
      details: { ipfsHash: ipfsResult.hash }
    });

    await identity.save();

    res.json({
      message: 'Identity updated successfully',
      identity: {
        identityId: identity.identityId,
        ipfsHash: identity.ipfsMetadataHash,
        updatedAt: identity.updatedAt
      }
    });

  } catch (error) {
    console.error('Identity update error:', error);
    res.status(500).json({
      error: 'Failed to update identity',
      message: error.message
    });
  }
});

// Issue identity NFT
router.post('/issue-nft', authenticateToken, async (req, res) => {
  try {
    const identity = await Identity.findOne({ userId: req.user._id });
    
    if (!identity) {
      return res.status(404).json({
        error: 'Identity not found'
      });
    }

    if (identity.status !== 'verified') {
      return res.status(400).json({
        error: 'Identity not verified',
        message: 'Identity must be verified before issuing NFT'
      });
    }

    if (identity.hederaNFTTokenId) {
      return res.status(409).json({
        error: 'NFT already issued',
        message: 'Identity NFT has already been issued'
      });
    }

    // Create NFT token
    const tokenId = await hederaService.createIdentityNFT(
      'IDweb3 Identity',
      'IDW3ID',
      `Digital Identity for ${req.user.username}`
    );

    // Mint NFT with identity metadata
    const nftMetadata = {
      identityId: identity.identityId,
      holder: req.user.username,
      verificationLevel: identity.verificationLevel,
      ipfsHash: identity.ipfsMetadataHash,
      issuedAt: new Date().toISOString()
    };

    const serial = await hederaService.mintIdentityNFT(tokenId, nftMetadata);

    // Update identity record
    identity.hederaNFTTokenId = tokenId;
    identity.hederaNFTSerial = serial;
    
    identity.verificationHistory.push({
      action: 'nft_issued',
      verifier: 'system',
      details: { tokenId, serial }
    });

    await identity.save();

    res.json({
      message: 'Identity NFT issued successfully',
      nft: {
        tokenId,
        serial,
        metadata: nftMetadata
      }
    });

  } catch (error) {
    console.error('NFT issuance error:', error);
    res.status(500).json({
      error: 'Failed to issue NFT',
      message: error.message
    });
  }
});

module.exports = router;