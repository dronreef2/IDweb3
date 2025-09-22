import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { DigitalIdentity, DIDDocument, User, VerifiableCredential } from '../types/identity';
import { DigitalIdentity as DigitalIdentityModel } from '../models/DigitalIdentity';
import { User as UserModel } from '../models/User';
import { VerifiableCredential as VerifiableCredentialModel } from '../models/VerifiableCredential';
import { HederaService } from './HederaService';
import { GuardianService } from './GuardianService';
import { IPFSService } from './IPFSService';
import winston from 'winston';

export class IdentityService {
  private hederaService: HederaService;
  private guardianService: GuardianService;
  private ipfsService: IPFSService;
  private logger: winston.Logger;

  constructor() {
    this.hederaService = new HederaService();
    this.guardianService = new GuardianService();
    this.ipfsService = new IPFSService();
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'identity.log' })
      ]
    });

    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    await this.ipfsService.initialize();
  }

  async createDigitalIdentity(userId: string): Promise<DigitalIdentity> {
    try {
      const user = await UserModel.findOne({ id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      if (user.identityId) {
        throw new Error('User already has a digital identity');
      }

      const identityId = uuidv4();
      const keyPair = crypto.generateKeyPairSync('ed25519');
      const publicKey = keyPair.publicKey.export({ type: 'spki', format: 'pem' });
      const privateKey = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' });

      // Create DID
      const did = `did:hedera:${this.hederaService.getAccountId()}:${identityId}`;
      
      // Create DID Document
      const didDocument: DIDDocument = {
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1'
        ],
        id: did,
        controller: did,
        verificationMethod: [{
          id: `${did}#key-1`,
          type: 'Ed25519VerificationKey2020',
          controller: did,
          publicKeyMultibase: Buffer.from(publicKey as string).toString('base64')
        }],
        authentication: [`${did}#key-1`],
        assertionMethod: [`${did}#key-1`],
        keyAgreement: [`${did}#key-1`],
        capabilityInvocation: [`${did}#key-1`],
        capabilityDelegation: [`${did}#key-1`]
      };

      // Create identity topic on Hedera
      const topicId = await this.hederaService.createIdentityTopic();
      
      // Submit DID document to Hedera
      const didDocumentMessage = JSON.stringify({
        type: 'DID_CREATE',
        did,
        didDocument,
        timestamp: new Date().toISOString()
      });

      await this.hederaService.submitIdentityMessage(topicId, didDocumentMessage);

      // Store DID document on IPFS
      const ipfsResult = await this.ipfsService.storeJSON(didDocument);

      // Register DID with Guardian
      await this.guardianService.registerDID(did, publicKey as string);

      // Create digital identity record
      const digitalIdentity: DigitalIdentity = {
        id: identityId,
        userId,
        hederaAccountId: this.hederaService.getAccountId(),
        publicKey: publicKey as string,
        didDocument,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      const identityDoc = new DigitalIdentityModel(digitalIdentity);
      await identityDoc.save();

      // Update user with identity ID
      await UserModel.updateOne({ id: userId }, { identityId });

      this.logger.info(`Created digital identity for user: ${userId}`);
      return digitalIdentity;

    } catch (error) {
      this.logger.error('Failed to create digital identity:', error);
      throw error;
    }
  }

  async getDigitalIdentity(identityId: string): Promise<DigitalIdentity | null> {
    try {
      const identity = await DigitalIdentityModel.findOne({ id: identityId });
      return identity ? identity.toObject() : null;
    } catch (error) {
      this.logger.error('Failed to get digital identity:', error);
      throw error;
    }
  }

  async issueCredential(
    identityId: string,
    credentialType: string,
    claims: Record<string, any>,
    expirationDate?: Date
  ): Promise<VerifiableCredential> {
    try {
      const identity = await this.getDigitalIdentity(identityId);
      if (!identity) {
        throw new Error('Digital identity not found');
      }

      const credentialId = uuidv4();
      const issuanceDate = new Date().toISOString();
      
      const credentialBase = {
        id: `urn:uuid:${credentialId}`,
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1'
        ],
        type: ['VerifiableCredential', credentialType],
        issuer: identity.didDocument.id,
        issuanceDate,
        expirationDate: expirationDate?.toISOString(),
        credentialSubject: {
          id: identity.didDocument.id,
          ...claims
        }
      };

      const credential: VerifiableCredential = {
        ...credentialBase,
        proof: {
          type: 'Ed25519Signature2020',
          created: issuanceDate,
          verificationMethod: `${identity.didDocument.id}#key-1`,
          proofPurpose: 'assertionMethod',
          jws: await this.createProof(credentialBase, identity.publicKey)
        }
      };

      // Store credential on IPFS
      await this.ipfsService.storeJSON(credential);

      // Save credential to database
      const credentialDoc = new VerifiableCredentialModel(credential);
      await credentialDoc.save();

      this.logger.info(`Issued credential: ${credentialId} for identity: ${identityId}`);
      return credential;

    } catch (error) {
      this.logger.error('Failed to issue credential:', error);
      throw error;
    }
  }

  async verifyCredential(credential: VerifiableCredential): Promise<boolean> {
    try {
      // Verify with Guardian service
      const isValid = await this.guardianService.verifyCredential(credential);
      
      this.logger.info(`Verified credential: ${credential.id}, valid: ${isValid}`);
      return isValid;
    } catch (error) {
      this.logger.error('Failed to verify credential:', error);
      throw error;
    }
  }

  async getUserCredentials(identityId: string): Promise<VerifiableCredential[]> {
    try {
      const identity = await this.getDigitalIdentity(identityId);
      if (!identity) {
        throw new Error('Digital identity not found');
      }

      const credentials = await VerifiableCredentialModel.find({
        'credentialSubject.id': identity.didDocument.id
      });

      return credentials.map(cred => cred.toObject());
    } catch (error) {
      this.logger.error('Failed to get user credentials:', error);
      throw error;
    }
  }

  private async createProof(credential: any, privateKey: string): Promise<string> {
    try {
      // Create a simplified proof for demonstration
      const credentialString = JSON.stringify(credential);
      const signature = await this.hederaService.signMessage(credentialString);
      return signature;
    } catch (error) {
      this.logger.error('Failed to create proof:', error);
      throw error;
    }
  }
}