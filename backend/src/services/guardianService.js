const axios = require('axios');

class GuardianService {
  constructor() {
    this.baseURL = process.env.GUARDIAN_URL || 'http://localhost:3002';
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Create a new policy for identity verification
  async createIdentityPolicy(policyData) {
    try {
      const response = await this.apiClient.post('/policies', policyData);
      console.log('✅ Identity policy created:', response.data.policyId);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating identity policy:', error.response?.data || error.message);
      throw error;
    }
  }

  // Register a new user in Guardian
  async registerUser(userData) {
    try {
      const response = await this.apiClient.post('/accounts/register', userData);
      console.log('✅ User registered in Guardian:', response.data.username);
      return response.data;
    } catch (error) {
      console.error('❌ Error registering user in Guardian:', error.response?.data || error.message);
      throw error;
    }
  }

  // Create a verifiable credential
  async createCredential(credentialData) {
    try {
      const response = await this.apiClient.post('/policies/credentials', credentialData);
      console.log('✅ Credential created:', response.data.credentialId);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating credential:', error.response?.data || error.message);
      throw error;
    }
  }

  // Verify a credential
  async verifyCredential(credentialId) {
    try {
      const response = await this.apiClient.get(`/policies/credentials/${credentialId}/verify`);
      console.log('✅ Credential verified:', credentialId);
      return response.data;
    } catch (error) {
      console.error('❌ Error verifying credential:', error.response?.data || error.message);
      throw error;
    }
  }

  // Submit document for verification
  async submitDocument(documentData) {
    try {
      const response = await this.apiClient.post('/policies/documents', documentData);
      console.log('✅ Document submitted:', response.data.documentId);
      return response.data;
    } catch (error) {
      console.error('❌ Error submitting document:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get policy status
  async getPolicyStatus(policyId) {
    try {
      const response = await this.apiClient.get(`/policies/${policyId}/status`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting policy status:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get user credentials
  async getUserCredentials(userId) {
    try {
      const response = await this.apiClient.get(`/accounts/${userId}/credentials`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting user credentials:', error.response?.data || error.message);
      throw error;
    }
  }

  // Issue credential to user
  async issueCredential(userId, credentialData) {
    try {
      const response = await this.apiClient.post(`/accounts/${userId}/credentials/issue`, credentialData);
      console.log('✅ Credential issued to user:', userId);
      return response.data;
    } catch (error) {
      console.error('❌ Error issuing credential:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = GuardianService;