export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateIdentityRequest {
  userProfile: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
}

export interface IssueCredentialRequest {
  identityId: string;
  credentialType: string;
  claims: Record<string, any>;
  expirationDate?: string;
}

export interface SignDocumentRequest {
  documentHash: string;
  identityId: string;
  metadata?: Record<string, any>;
}

export interface VerifyCredentialRequest {
  credential: object;
  challenge?: string;
}