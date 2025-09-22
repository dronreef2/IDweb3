import { Request, Response } from 'express';
import { IdentityService } from '../services/IdentityService';
import { APIResponse } from '../types/api';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

export class IdentityController {
  private identityService: IdentityService;

  constructor() {
    this.identityService = new IdentityService();
  }

  createIdentity = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const identity = await this.identityService.createDigitalIdentity(userId);

    const response: APIResponse = {
      success: true,
      data: identity,
      message: 'Digital identity created successfully',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  });

  getIdentity = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { identityId } = req.params;

    // Verify user owns this identity or has permission to view it
    if (req.user!.identityId !== identityId) {
      const response: APIResponse = {
        success: false,
        error: 'Access denied to this identity',
        timestamp: new Date().toISOString()
      };
      res.status(403).json(response);
      return;
    }

    const identity = await this.identityService.getDigitalIdentity(identityId);
    
    if (!identity) {
      const response: APIResponse = {
        success: false,
        error: 'Digital identity not found',
        timestamp: new Date().toISOString()
      };
      res.status(404).json(response);
      return;
    }

    const response: APIResponse = {
      success: true,
      data: identity,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });

  issueCredential = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { identityId, credentialType, claims, expirationDate } = req.body;

    // Verify user owns this identity
    if (req.user!.identityId !== identityId) {
      const response: APIResponse = {
        success: false,
        error: 'Access denied to this identity',
        timestamp: new Date().toISOString()
      };
      res.status(403).json(response);
      return;
    }

    const expDate = expirationDate ? new Date(expirationDate) : undefined;
    const credential = await this.identityService.issueCredential(
      identityId,
      credentialType,
      claims,
      expDate
    );

    const response: APIResponse = {
      success: true,
      data: credential,
      message: 'Credential issued successfully',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  });

  verifyCredential = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { credential } = req.body;

    const isValid = await this.identityService.verifyCredential(credential);

    const response: APIResponse = {
      success: true,
      data: { valid: isValid },
      message: `Credential is ${isValid ? 'valid' : 'invalid'}`,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });

  getUserCredentials = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const identityId = req.user!.identityId;

    if (!identityId) {
      const response: APIResponse = {
        success: false,
        error: 'User does not have a digital identity',
        timestamp: new Date().toISOString()
      };
      res.status(404).json(response);
      return;
    }

    const credentials = await this.identityService.getUserCredentials(identityId);

    const response: APIResponse = {
      success: true,
      data: credentials,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });

  getCredential = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { credentialId } = req.params;
    const identityId = req.user!.identityId;

    if (!identityId) {
      const response: APIResponse = {
        success: false,
        error: 'User does not have a digital identity',
        timestamp: new Date().toISOString()
      };
      res.status(404).json(response);
      return;
    }

    const credentials = await this.identityService.getUserCredentials(identityId);
    const credential = credentials.find(cred => cred.id === `urn:uuid:${credentialId}`);

    if (!credential) {
      const response: APIResponse = {
        success: false,
        error: 'Credential not found',
        timestamp: new Date().toISOString()
      };
      res.status(404).json(response);
      return;
    }

    const response: APIResponse = {
      success: true,
      data: credential,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });
}