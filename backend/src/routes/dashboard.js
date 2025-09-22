const express = require('express');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Identity = require('../models/Identity');
const Credential = require('../models/Credential');

const router = express.Router();

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

// Get dashboard overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    // Get user's identity
    const identity = await Identity.findOne({ userId: req.user._id });
    
    // Get user's credentials
    const credentials = await Credential.find({ 
      userId: req.user._id,
      isActive: true 
    });

    // Get credentials issued by this user
    const issuedCredentials = await Credential.find({
      'issuer.did': `did:hedera:testnet:${req.user._id}`,
      isActive: true
    });

    // Calculate statistics
    const stats = {
      identity: {
        exists: !!identity,
        status: identity?.status || 'none',
        verificationLevel: identity?.verificationLevel || 'none',
        documentsCount: identity?.metadata?.documents?.length || 0,
        verifiedDocuments: identity?.metadata?.documents?.filter(doc => doc.verified).length || 0,
        hasNFT: !!(identity?.hederaNFTTokenId),
        createdAt: identity?.createdAt || null
      },
      credentials: {
        total: credentials.length,
        active: credentials.filter(c => c.isValid()).length,
        expired: credentials.filter(c => c.isExpired()).length,
        revoked: credentials.filter(c => c.status === 'revoked').length,
        byType: credentials.reduce((acc, cred) => {
          acc[cred.type] = (acc[cred.type] || 0) + 1;
          return acc;
        }, {})
      },
      issuedCredentials: {
        total: issuedCredentials.length,
        active: issuedCredentials.filter(c => c.isValid()).length,
        totalVerifications: issuedCredentials.reduce((acc, cred) => acc + cred.verifications.length, 0)
      },
      recentActivity: []
    };

    // Get recent activity
    const recentActivities = [];

    if (identity) {
      // Add recent verification history
      const recentVerifications = identity.verificationHistory
        .slice(-5)
        .reverse()
        .map(activity => ({
          type: 'verification',
          action: activity.action,
          timestamp: activity.timestamp,
          details: activity.details,
          verifier: activity.verifier
        }));
      
      recentActivities.push(...recentVerifications);
    }

    // Add recent credentials
    const recentCredentials = credentials
      .slice(-3)
      .map(cred => ({
        type: 'credential',
        action: 'credential_received',
        timestamp: cred.createdAt,
        details: {
          credentialId: cred.credentialId,
          type: cred.type,
          issuer: cred.issuer.name
        }
      }));

    recentActivities.push(...recentCredentials);

    // Sort by timestamp and take latest 10
    stats.recentActivity = recentActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json({
      user: {
        username: req.user.username,
        fullName: req.user.fullName,
        email: req.user.email,
        lastLogin: req.user.lastLogin,
        memberSince: req.user.createdAt
      },
      stats
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard data',
      message: error.message
    });
  }
});

// Get activity feed
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const activities = [];

    // Get identity verification history
    const identity = await Identity.findOne({ userId: req.user._id });
    if (identity) {
      const verificationActivities = identity.verificationHistory.map(activity => ({
        type: 'identity_activity',
        action: activity.action,
        timestamp: activity.timestamp,
        details: activity.details,
        verifier: activity.verifier,
        identityId: identity.identityId
      }));
      activities.push(...verificationActivities);
    }

    // Get credential activities
    const credentials = await Credential.find({ userId: req.user._id });
    credentials.forEach(cred => {
      // Credential issuance
      activities.push({
        type: 'credential_activity',
        action: 'credential_issued',
        timestamp: cred.createdAt,
        details: {
          credentialId: cred.credentialId,
          type: cred.type,
          issuer: cred.issuer.name
        }
      });

      // Verifications
      cred.verifications.forEach(verification => {
        activities.push({
          type: 'credential_activity',
          action: 'credential_verified',
          timestamp: verification.verificationDate,
          details: {
            credentialId: cred.credentialId,
            type: cred.type,
            verifier: verification.verifierName,
            method: verification.verificationMethod
          }
        });
      });

      // Usage records
      cred.usage.forEach(usage => {
        activities.push({
          type: 'credential_activity',
          action: 'credential_used',
          timestamp: usage.usedAt,
          details: {
            credentialId: cred.credentialId,
            type: cred.type,
            purpose: usage.purpose,
            application: usage.application
          }
        });
      });
    });

    // Sort by timestamp and paginate
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(skip, skip + parseInt(limit));

    res.json({
      activities: sortedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activities.length,
        pages: Math.ceil(activities.length / limit)
      }
    });

  } catch (error) {
    console.error('Activity feed error:', error);
    res.status(500).json({
      error: 'Failed to get activity feed',
      message: error.message
    });
  }
});

// Get analytics data
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get credentials in period
    const credentials = await Credential.find({
      userId: req.user._id,
      createdAt: { $gte: startDate }
    });

    // Get usage analytics
    const usageData = credentials.map(cred => ({
      date: cred.createdAt.toISOString().split('T')[0],
      type: cred.type,
      verifications: cred.verifications.length,
      usage: cred.usage.length
    }));

    // Group by date
    const dailyStats = usageData.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = {
          date: item.date,
          credentials: 0,
          verifications: 0,
          usage: 0,
          types: {}
        };
      }
      
      acc[item.date].credentials += 1;
      acc[item.date].verifications += item.verifications;
      acc[item.date].usage += item.usage;
      acc[item.date].types[item.type] = (acc[item.date].types[item.type] || 0) + 1;
      
      return acc;
    }, {});

    // Convert to array and sort
    const analytics = Object.values(dailyStats)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate totals
    const totals = {
      credentials: credentials.length,
      verifications: credentials.reduce((acc, cred) => acc + cred.verifications.length, 0),
      usage: credentials.reduce((acc, cred) => acc + cred.usage.length, 0),
      uniqueVerifiers: new Set(
        credentials.flatMap(cred => 
          cred.verifications.map(v => v.verifierId)
        )
      ).size
    };

    res.json({
      analytics,
      totals,
      period,
      startDate,
      endDate: now
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Failed to get analytics',
      message: error.message
    });
  }
});

// Get verification requests (for verifiers)
router.get('/verification-requests', authenticateToken, async (req, res) => {
  try {
    // Get identities with pending documents
    const pendingIdentities = await Identity.find({
      'metadata.documents.verified': false,
      status: 'pending'
    }).populate('userId', 'username fullName email')
      .limit(50)
      .sort({ createdAt: -1 });

    const verificationRequests = pendingIdentities.map(identity => ({
      identityId: identity.identityId,
      user: {
        username: identity.userId.username,
        fullName: identity.userId.fullName,
        email: identity.userId.email
      },
      documentsCount: identity.metadata.documents.length,
      unverifiedDocuments: identity.metadata.documents.filter(doc => !doc.verified).length,
      submittedAt: identity.createdAt,
      status: identity.status
    }));

    res.json({
      requests: verificationRequests,
      total: verificationRequests.length
    });

  } catch (error) {
    console.error('Verification requests error:', error);
    res.status(500).json({
      error: 'Failed to get verification requests',
      message: error.message
    });
  }
});

module.exports = router;