import mongoose, { Schema, Document } from 'mongoose';
import { VerifiableCredential as IVerifiableCredential, Proof, CredentialStatus } from '../types/identity';

const ProofSchema = new Schema<Proof>({
  type: { type: String, required: true },
  created: { type: String, required: true },
  verificationMethod: { type: String, required: true },
  proofPurpose: { type: String, required: true },
  jws: { type: String },
  proofValue: { type: String }
});

const CredentialStatusSchema = new Schema<CredentialStatus>({
  id: { type: String, required: true },
  type: { type: String, required: true }
});

const VerifiableCredentialSchema = new Schema<IVerifiableCredential & Document>({
  id: { type: String, required: true, unique: true },
  '@context': [{ type: String, required: true }],
  type: [{ type: String, required: true }],
  issuer: { type: Schema.Types.Mixed, required: true },
  issuanceDate: { type: String, required: true },
  expirationDate: { type: String },
  credentialSubject: { type: Schema.Types.Mixed, required: true },
  proof: { type: ProofSchema, required: true },
  status: { type: CredentialStatusSchema }
}, {
  timestamps: true
});

export const VerifiableCredential = mongoose.model<IVerifiableCredential & Document>('VerifiableCredential', VerifiableCredentialSchema);