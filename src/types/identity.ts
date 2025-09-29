export interface DigitalIdentity {
  id: string;
  userId: string;
  hederaAccountId?: string;
  publicKey: string;
  didDocument: DIDDocument;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'revoked' | 'suspended';
}

export interface DIDDocument {
  '@context': string[];
  id: string;
  controller: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  keyAgreement: string[];
  capabilityInvocation: string[];
  capabilityDelegation: string[];
  service?: ServiceEndpoint[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyJwk?: object;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface VerifiableCredential {
  id: string;
  '@context': string[];
  type: string[];
  issuer: string | { id: string; [key: string]: any };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: object;
  proof: Proof;
  status?: CredentialStatus;
}

export interface Proof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  jws?: string;
  proofValue?: string;
}

export interface CredentialStatus {
  id: string;
  type: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
  identityId?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  address?: Address;
  phoneNumber?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface DocumentSignature {
  id: string;
  documentHash: string;
  signerId: string;
  signature: string;
  timestamp: Date;
  hederaTransactionId?: string;
  ipfsHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface IPFSStorageResult {
  cid: string;
  url: string;
  size: number;
}