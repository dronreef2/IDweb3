const mongoose = require('mongoose');

const identitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  identityId: {
    type: String,
    required: true,
    unique: true
  },
  hederaTopicId: {
    type: String,
    required: true
  },
  hederaNFTTokenId: {
    type: String,
    sparse: true
  },
  hederaNFTSerial: {
    type: String,
    sparse: true
  },
  guardianDID: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'pending'
  },
  verificationLevel: {
    type: String,
    enum: ['basic', 'enhanced', 'premium'],
    default: 'basic'
  },
  metadata: {
    personalInfo: {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      nationality: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      }
    },
    documents: [{
      type: {
        type: String,
        enum: ['passport', 'license', 'diploma', 'certificate', 'other']
      },
      ipfsHash: String,
      filename: String,
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date,
      verifiedBy: String
    }],
    biometrics: {
      faceHash: String,
      fingerprintHash: String
    }
  },
  ipfsMetadataHash: {
    type: String, // IPFS hash of complete identity metadata
    required: true
  },
  credentialsIssued: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Credential'
  }],
  verificationHistory: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    verifier: String,
    details: mongoose.Schema.Types.Mixed
  }],
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

// Index for efficient queries
identitySchema.index({ userId: 1 });
identitySchema.index({ identityId: 1 });
identitySchema.index({ status: 1 });
identitySchema.index({ verificationLevel: 1 });

// Methods
identitySchema.methods.addDocument = function(documentData) {
  this.metadata.documents.push(documentData);
  return this.save();
};

identitySchema.methods.verifyDocument = function(documentIndex, verifierInfo) {
  if (this.metadata.documents[documentIndex]) {
    this.metadata.documents[documentIndex].verified = true;
    this.metadata.documents[documentIndex].verifiedAt = new Date();
    this.metadata.documents[documentIndex].verifiedBy = verifierInfo;
    
    this.verificationHistory.push({
      action: 'document_verified',
      verifier: verifierInfo,
      details: { documentIndex, documentType: this.metadata.documents[documentIndex].type }
    });
  }
  return this.save();
};

identitySchema.methods.updateStatus = function(newStatus, verifier, details = {}) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  this.verificationHistory.push({
    action: 'status_change',
    verifier,
    details: { from: oldStatus, to: newStatus, ...details }
  });
  
  return this.save();
};

module.exports = mongoose.model('Identity', identitySchema);