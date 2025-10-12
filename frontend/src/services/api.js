import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

/**
 * Create axios instance with default configuration
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000
});

/**
 * Request interceptor to add JWT token to requests
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle common errors
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem("authToken");
          window.location.href = "/login";
          break;
        case 403:
          console.error("Access forbidden");
          break;
        case 404:
          console.error("Resource not found");
          break;
        case 500:
          console.error("Server error");
          break;
        default:
          console.error("API error:", error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

// ========================================
// Authentication Services
// ========================================

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise} API response
 */
export async function register(userData) {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Login user and store JWT token
 * @param {Object} credentials - Login credentials
 * @returns {Promise} API response with token
 */
export async function login(credentials) {
  try {
    const response = await api.post("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("authToken", response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Logout user and clear token
 */
export function logout() {
  localStorage.removeItem("authToken");
  window.location.href = "/login";
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!localStorage.getItem("authToken");
}

/**
 * Get current user profile
 * @returns {Promise} User profile data
 */
export async function getCurrentUser() {
  try {
    const response = await api.get("/auth/profile");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// ========================================
// Identity Services
// ========================================

/**
 * Create a new digital identity
 * @param {Object} data - Identity data
 * @returns {Promise} API response
 */
export async function createIdentity(data) {
  try {
    const response = await api.post("/identity/create", data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Get current user's identity
 * @returns {Promise} Identity data
 */
export async function getMyIdentity() {
  try {
    const response = await api.get("/identity/me");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Issue an identity NFT on Hedera
 * @param {string} identityId - Identity ID
 * @returns {Promise} NFT issuance result
 */
export async function issueIdentityNFT(identityId) {
  try {
    const response = await api.post("/identity/issue-nft", { identityId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Verify an identity
 * @param {string} identityId - Identity ID to verify
 * @returns {Promise} Verification result
 */
export async function verifyIdentity(identityId) {
  try {
    const response = await api.post("/identity/verify", { identityId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// ========================================
// Document Services
// ========================================

/**
 * Upload a document to IPFS
 * @param {File} file - File to upload
 * @param {string} documentType - Type of document (e.g., "passport", "driver_license")
 * @param {string} description - Document description
 * @returns {Promise} Upload result with IPFS hash
 */
export async function uploadDocument(file, documentType, description) {
  try {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("documentType", documentType);
    formData.append("description", description);
    
    const response = await api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * List user's documents
 * @returns {Promise} List of documents
 */
export async function listDocuments() {
  try {
    const response = await api.get("/documents/list");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Get a specific document
 * @param {string} documentId - Document ID
 * @returns {Promise} Document details
 */
export async function getDocument(documentId) {
  try {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Verify a document
 * @param {string} documentId - Document ID to verify
 * @returns {Promise} Verification result
 */
export async function verifyDocument(documentId) {
  try {
    const response = await api.post("/documents/verify", { documentId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// ========================================
// Credential Services
// ========================================

/**
 * Get user's credentials
 * @returns {Promise} List of credentials
 */
export async function getMyCredentials() {
  try {
    const response = await api.get("/credentials/my-credentials");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Issue a new credential
 * @param {Object} credentialData - Credential data
 * @returns {Promise} Credential issuance result
 */
export async function issueCredential(credentialData) {
  try {
    const response = await api.post("/credentials/issue", credentialData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Verify a credential
 * @param {string} credentialId - Credential ID
 * @returns {Promise} Verification result
 */
export async function verifyCredential(credentialId) {
  try {
    const response = await api.post("/credentials/verify", { credentialId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Revoke a credential
 * @param {string} credentialId - Credential ID to revoke
 * @returns {Promise} Revocation result
 */
export async function revokeCredential(credentialId) {
  try {
    const response = await api.post("/credentials/revoke", { credentialId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// ========================================
// Dashboard Services
// ========================================

/**
 * Get dashboard overview data
 * @returns {Promise} Dashboard statistics
 */
export async function getDashboardOverview() {
  try {
    const response = await api.get("/dashboard/overview");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Get activity feed
 * @returns {Promise} Activity feed data
 */
export async function getActivityFeed() {
  try {
    const response = await api.get("/dashboard/activity");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// ========================================
// Health Check
// ========================================

/**
 * Check API health status
 * @returns {Promise} Health status
 */
export async function healthCheck() {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// Export the axios instance for direct use if needed
export default api;
