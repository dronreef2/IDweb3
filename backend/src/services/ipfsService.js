const { create } = require('ipfs-http-client');
const axios = require('axios');

class IPFSService {
  constructor() {
    this.apiKey = process.env.IPFS_API_KEY;
    this.gateway = process.env.IPFS_GATEWAY || 'https://w3s.link/ipfs/';
    
    // Initialize IPFS client for Web3.Storage or local IPFS node
    if (this.apiKey) {
      this.client = create({
        host: 'api.web3.storage',
        port: 443,
        protocol: 'https',
        headers: {
          authorization: `Bearer ${this.apiKey}`
        }
      });
    } else {
      // Fallback to local IPFS node
      this.client = create({
        host: 'localhost',
        port: 5001,
        protocol: 'http'
      });
    }
  }

  // Upload document to IPFS
  async uploadDocument(buffer, filename, metadata = {}) {
    try {
      const file = {
        path: filename,
        content: buffer
      };

      const result = await this.client.add(file);
      const hash = result.cid.toString();
      
      console.log('✅ Document uploaded to IPFS:', hash);
      
      return {
        hash,
        filename,
        size: buffer.length,
        gateway: `${this.gateway}${hash}`,
        metadata
      };
    } catch (error) {
      console.error('❌ Error uploading to IPFS:', error);
      throw error;
    }
  }

  // Upload JSON data to IPFS
  async uploadJSON(data) {
    try {
      const buffer = Buffer.from(JSON.stringify(data, null, 2));
      const result = await this.client.add(buffer);
      const hash = result.cid.toString();
      
      console.log('✅ JSON data uploaded to IPFS:', hash);
      
      return {
        hash,
        gateway: `${this.gateway}${hash}`,
        data
      };
    } catch (error) {
      console.error('❌ Error uploading JSON to IPFS:', error);
      throw error;
    }
  }

  // Get document from IPFS
  async getDocument(hash) {
    try {
      const url = `${this.gateway}${hash}`;
      const response = await axios.get(url, {
        responseType: 'arraybuffer'
      });
      
      console.log('✅ Document retrieved from IPFS:', hash);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting document from IPFS:', error);
      throw error;
    }
  }

  // Get JSON data from IPFS
  async getJSON(hash) {
    try {
      const url = `${this.gateway}${hash}`;
      const response = await axios.get(url);
      
      console.log('✅ JSON data retrieved from IPFS:', hash);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting JSON from IPFS:', error);
      throw error;
    }
  }

  // Pin document to ensure persistence
  async pinDocument(hash) {
    try {
      await this.client.pin.add(hash);
      console.log('✅ Document pinned to IPFS:', hash);
      return true;
    } catch (error) {
      console.error('❌ Error pinning document:', error);
      throw error;
    }
  }

  // Validate IPFS hash format
  isValidHash(hash) {
    // Basic IPFS hash validation (CIDv0 and CIDv1)
    const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    const cidv1Regex = /^b[a-z2-7]{58}$/;
    
    return cidv0Regex.test(hash) || cidv1Regex.test(hash);
  }
}

module.exports = IPFSService;