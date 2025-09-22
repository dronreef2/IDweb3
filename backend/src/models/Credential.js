const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  credentialId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  identityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identity',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'identity_verification',
      'educational_credential',
      'professional_license',
      'government_id',
      'medical_record',
      'financial_verification',
      'custom'
    ]
  },
  issuer: {
    name: String,
    did: String,
    address: String,
    publicKey: String
  },
  subject: {
    did: String,
    attributes: mongoose.Schema.Types.Mixed
  },
  credentialData: {
    // Verifiable Credential standard format
    '@context': [String],
    type: [String],
    issuer: mongoose.Schema.Types.Mixed,
    issuanceDate: Date,
    expirationDate: Date,
    credentialSubject: mongoose.Schema.Types.Mixed,
    proof: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'suspended', 'expired'],
    default: 'active'
  },
  issuanceMethod: {
    type: String,
    enum: ['manual', 'automated', 'policy_workflow'],
    default: 'automated'
  },
  guardianCredentialId: {
    type: String,
    sparse: true
  },
  hederaTopicId: {
    type: String, // Topic where credential was recorded
    required: true
  },
  hederaMessageSequence: {
    type: Number, // Sequence number in the topic
    required: true
  },
  ipfsHash: {
    type: String, // IPFS hash of the credential document
    required: true
  },
  verifications: [{
    verifierId: String,
    verifierName: String,
    verified: Boolean,
    verificationDate: Date,
    verificationMethod: String,
    notes: String
  }],
  usage: [{
    usedBy: String,
    usedAt: Date,
    purpose: String,
    application: String
  }],
  metadata: {
    tags: [String],
    category: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    customFields: mongoose.Schema.Types.Mixed
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
credentialSchema.index({ userId: 1 });
credentialSchema.index({ identityId: 1 });
credentialSchema.index({ credentialId: 1 });
credentialSchema.index({ type: 1 });
credentialSchema.index({ status: 1 });
credentialSchema.index({ 'issuer.did': 1 });
credentialSchema.index({ 'credentialData.expirationDate': 1 });

// Methods
credentialSchema.methods.verify = function(verifierInfo) {
  this.verifications.push({
    verifierId: verifierInfo.id,
    verifierName: verifierInfo.name,
    verified: true,
    verificationDate: new Date(),
    verificationMethod: verifierInfo.method || 'manual',
    notes: verifierInfo.notes || ''
  });
  return this.save();
};

credentialSchema.methods.revoke = function(reason) {
  this.status = 'revoked';
  this.metadata.revocationReason = reason;
  this.metadata.revokedAt = new Date();
  return this.save();
};

credentialSchema.methods.recordUsage = function(usageInfo) {
  this.usage.push({
    usedBy: usageInfo.usedBy,
    usedAt: new Date(),
    purpose: usageInfo.purpose,
    application: usageInfo.application
  });
  return this.save();
};

credentialSchema.methods.isExpired = function() {
  return this.credentialData.expirationDate && 
         new Date() > new Date(this.credentialData.expirationDate);
};

// Check if credential is valid
credentialSchema.methods.isValid = function() {
  return this.status === 'active' && 
         this.isActive && 
         !this.isExpired();
};

module.exports = mongoose.model('Credential', credentialSchema);