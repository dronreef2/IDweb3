import mongoose, { Schema, Document } from 'mongoose';
import { DocumentSignature as IDocumentSignature } from '../types/identity';

const DocumentSignatureSchema = new Schema<IDocumentSignature & Document>({
  id: { type: String, required: true, unique: true },
  documentHash: { type: String, required: true },
  signerId: { type: String, required: true, ref: 'DigitalIdentity' },
  signature: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  hederaTransactionId: { type: String },
  ipfsHash: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'failed'], 
    default: 'pending' 
  }
}, {
  timestamps: true
});

export const DocumentSignature = mongoose.model<IDocumentSignature & Document>('DocumentSignature', DocumentSignatureSchema);