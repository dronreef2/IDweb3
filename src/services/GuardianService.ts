import axios, { AxiosInstance } from 'axios';
import { VerifiableCredential } from '../types/identity';
import winston from 'winston';

export class GuardianService {
  private api: AxiosInstance;
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'guardian.log' })
      ]
    });

    const baseURL = process.env.GUARDIAN_API_URL || 'http://localhost:3001';
    const apiKey = process.env.GUARDIAN_API_KEY;

    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      timeout: 30000
    });
  }

  async createSchema(name: string, description: string, fields: any[]): Promise<any> {
    try {
      const schema = {
        name,
        description,
        entity: 'VC',
        fields,
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1'
        ]
      };

      const response = await this.api.post('/schemas', schema);
      this.logger.info(`Created schema: ${name}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create schema:', error);
      throw error;
    }
  }

  async issueCredential(
    schemaId: string,
    issuerDID: string,
    subjectDID: string,
    claims: Record<string, any>
  ): Promise<VerifiableCredential> {
    try {
      const credentialData = {
        schemaId,
        issuer: issuerDID,
        subject: subjectDID,
        claims
      };

      const response = await this.api.post('/credentials/issue', credentialData);
      this.logger.info(`Issued credential for subject: ${subjectDID}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to issue credential:', error);
      throw error;
    }
  }

  async verifyCredential(credential: VerifiableCredential): Promise<boolean> {
    try {
      const response = await this.api.post('/credentials/verify', { credential });
      this.logger.info(`Verified credential: ${credential.id}`);
      return response.data.verified;
    } catch (error) {
      this.logger.error('Failed to verify credential:', error);
      throw error;
    }
  }

  async createPolicy(name: string, description: string, config: any): Promise<any> {
    try {
      const policy = {
        name,
        description,
        config
      };

      const response = await this.api.post('/policies', policy);
      this.logger.info(`Created policy: ${name}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create policy:', error);
      throw error;
    }
  }

  async executePolicy(policyId: string, data: any): Promise<any> {
    try {
      const response = await this.api.post(`/policies/${policyId}/execute`, data);
      this.logger.info(`Executed policy: ${policyId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to execute policy:', error);
      throw error;
    }
  }

  async registerDID(did: string, publicKey: string): Promise<any> {
    try {
      const didData = {
        did,
        publicKey,
        method: 'hedera'
      };

      const response = await this.api.post('/dids/register', didData);
      this.logger.info(`Registered DID: ${did}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to register DID:', error);
      throw error;
    }
  }

  async resolveDID(did: string): Promise<any> {
    try {
      const response = await this.api.get(`/dids/resolve/${encodeURIComponent(did)}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to resolve DID:', error);
      throw error;
    }
  }
}