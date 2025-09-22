import mongoose, { Schema, Document } from 'mongoose';
import { DigitalIdentity as IDigitalIdentity, DIDDocument, VerificationMethod, ServiceEndpoint } from '../types/identity';

const VerificationMethodSchema = new Schema<VerificationMethod>({
  id: { type: String, required: true },
  type: { type: String, required: true },
  controller: { type: String, required: true },
  publicKeyMultibase: { type: String },
  publicKeyJwk: { type: Schema.Types.Mixed }
});

const ServiceEndpointSchema = new Schema<ServiceEndpoint>({
  id: { type: String, required: true },
  type: { type: String, required: true },
  serviceEndpoint: { type: String, required: true }
});

const DIDDocumentSchema = new Schema<DIDDocument>({
  '@context': [{ type: String, required: true }],
  id: { type: String, required: true },
  controller: { type: String, required: true },
  verificationMethod: [VerificationMethodSchema],
  authentication: [{ type: String }],
  assertionMethod: [{ type: String }],
  keyAgreement: [{ type: String }],
  capabilityInvocation: [{ type: String }],
  capabilityDelegation: [{ type: String }],
  service: [ServiceEndpointSchema]
});

const DigitalIdentitySchema = new Schema<IDigitalIdentity & Document>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  hederaAccountId: { type: String },
  publicKey: { type: String, required: true },
  didDocument: { type: DIDDocumentSchema, required: true },
  status: { 
    type: String, 
    enum: ['active', 'revoked', 'suspended'], 
    default: 'active' 
  }
}, {
  timestamps: true
});

export const DigitalIdentity = mongoose.model<IDigitalIdentity & Document>('DigitalIdentity', DigitalIdentitySchema);