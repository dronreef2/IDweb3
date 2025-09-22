import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { DocumentSignature } from '../types/identity';
import { DocumentSignature as DocumentSignatureModel } from '../models/DocumentSignature';
import { IdentityService } from './IdentityService';
import { HederaService } from './HederaService';
import { IPFSService } from './IPFSService';
import winston from 'winston';

export class DocumentSigningService {
  private identityService: IdentityService;
  private hederaService: HederaService;
  private ipfsService: IPFSService;
  private logger: winston.Logger;

  constructor() {
    this.identityService = new IdentityService();
    this.hederaService = new HederaService();
    this.ipfsService = new IPFSService();
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'document-signing.log' })
      ]
    });

    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    await this.ipfsService.initialize();
  }

  async signDocument(
    identityId: string,
    document: Buffer | string,
    metadata?: Record<string, any>
  ): Promise<DocumentSignature> {
    try {
      const identity = await this.identityService.getDigitalIdentity(identityId);
      if (!identity) {
        throw new Error('Digital identity not found');
      }

      if (identity.status !== 'active') {
        throw new Error('Digital identity is not active');
      }

      // Calculate document hash
      const documentBuffer = Buffer.isBuffer(document) ? document : Buffer.from(document);
      const documentHash = crypto.createHash('sha256').update(documentBuffer).digest('hex');

      // Create signature data
      const signatureData = {
        documentHash,
        signerId: identityId,
        timestamp: new Date(),
        metadata
      };

      const signatureString = JSON.stringify(signatureData);
      const signature = await this.hederaService.signMessage(signatureString);

      // Store document on IPFS
      const documentFile = new File([documentBuffer], 'document', { type: 'application/octet-stream' });
      const ipfsResult = await this.ipfsService.storeFile(documentFile);

      // Create signature record
      const documentSignature: DocumentSignature = {
        id: uuidv4(),
        documentHash,
        signerId: identityId,
        signature,
        timestamp: new Date(),
        ipfsHash: ipfsResult.cid,
        status: 'pending'
      };

      // Submit signature to Hedera
      const signatureMessage = JSON.stringify({
        type: 'DOCUMENT_SIGNATURE',
        signatureId: documentSignature.id,
        documentHash,
        signerId: identityId,
        signature,
        timestamp: documentSignature.timestamp.toISOString(),
        ipfsHash: ipfsResult.cid
      });

      const hederaResponse = await this.hederaService.submitIdentityMessage(
        await this.hederaService.createIdentityTopic(),
        signatureMessage
      );

      // Update signature with Hedera transaction ID
      documentSignature.hederaTransactionId = hederaResponse.transactionId.toString();
      documentSignature.status = 'confirmed';

      // Save signature to database
      const signatureDoc = new DocumentSignatureModel(documentSignature);
      await signatureDoc.save();

      this.logger.info(`Document signed: ${documentSignature.id} by identity: ${identityId}`);
      return documentSignature;

    } catch (error) {
      this.logger.error('Failed to sign document:', error);
      throw error;
    }
  }

  async verifyDocumentSignature(signatureId: string): Promise<{
    valid: boolean;
    signature: DocumentSignature | null;
    details?: string;
  }> {
    try {
      const signature = await DocumentSignatureModel.findOne({ id: signatureId });
      if (!signature) {
        return {
          valid: false,
          signature: null,
          details: 'Signature not found'
        };
      }

      const identity = await this.identityService.getDigitalIdentity(signature.signerId);
      if (!identity) {
        return {
          valid: false,
          signature: signature.toObject(),
          details: 'Signer identity not found'
        };
      }

      // Verify signature integrity
      const signatureData = {
        documentHash: signature.documentHash,
        signerId: signature.signerId,
        timestamp: signature.timestamp
      };

      const signatureString = JSON.stringify(signatureData);
      const expectedSignature = await this.hederaService.signMessage(signatureString);

      const isValid = expectedSignature === signature.signature && 
                     signature.status === 'confirmed';

      return {
        valid: isValid,
        signature: signature.toObject(),
        details: isValid ? 'Signature is valid' : 'Signature verification failed'
      };

    } catch (error) {
      this.logger.error('Failed to verify document signature:', error);
      throw error;
    }
  }

  async getDocumentSignatures(identityId: string): Promise<DocumentSignature[]> {
    try {
      const signatures = await DocumentSignatureModel.find({ signerId: identityId })
        .sort({ timestamp: -1 });

      return signatures.map(sig => sig.toObject());
    } catch (error) {
      this.logger.error('Failed to get document signatures:', error);
      throw error;
    }
  }

  async getDocumentByHash(documentHash: string): Promise<Buffer | null> {
    try {
      const signature = await DocumentSignatureModel.findOne({ documentHash });
      if (!signature || !signature.ipfsHash) {
        return null;
      }

      const response = await this.ipfsService.retrieveFile(signature.ipfsHash);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);

    } catch (error) {
      this.logger.error('Failed to retrieve document:', error);
      throw error;
    }
  }

  async validateDocumentIntegrity(documentHash: string, document: Buffer): Promise<boolean> {
    try {
      const calculatedHash = crypto.createHash('sha256').update(document).digest('hex');
      return calculatedHash === documentHash;
    } catch (error) {
      this.logger.error('Failed to validate document integrity:', error);
      throw error;
    }
  }
}