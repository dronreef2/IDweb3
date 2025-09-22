import { create, Client } from '@web3-storage/w3up-client';
import { IPFSStorageResult } from '../types/identity';
import winston from 'winston';

export class IPFSService {
  private client: Client | null = null;
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'ipfs.log' })
      ]
    });
  }

  async initialize(): Promise<void> {
    try {
      this.client = await create();
      this.logger.info('IPFS Web3.Storage client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize IPFS client:', error);
      throw error;
    }
  }

  async storeFile(file: File): Promise<IPFSStorageResult> {
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }

    try {
      const cid = await this.client.uploadFile(file);
      
      const result: IPFSStorageResult = {
        cid: cid.toString(),
        url: `https://${cid}.ipfs.w3s.link`,
        size: file.size
      };

      this.logger.info(`File stored on IPFS: ${result.cid}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to store file on IPFS:', error);
      throw error;
    }
  }

  async storeJSON(data: object): Promise<IPFSStorageResult> {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], 'data.json', { type: 'application/json' });
    
    return this.storeFile(file);
  }

  async retrieveFile(cid: string): Promise<Response> {
    try {
      const response = await fetch(`https://${cid}.ipfs.w3s.link`);
      if (!response.ok) {
        throw new Error(`Failed to retrieve file: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      this.logger.error('Failed to retrieve file from IPFS:', error);
      throw error;
    }
  }

  async retrieveJSON(cid: string): Promise<any> {
    const response = await this.retrieveFile(cid);
    return response.json();
  }
}