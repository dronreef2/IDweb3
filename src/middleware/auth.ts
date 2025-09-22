import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { APIResponse } from '../types/api';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    identityId?: string;
  };
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const response: APIResponse = {
          success: false,
          error: 'No valid authorization header provided',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(response);
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      const user = await this.authService.verifyToken(token);
      req.user = {
        id: user.id,
        email: user.email,
        identityId: user.identityId
      };

      next();
    } catch (error) {
      const response: APIResponse = {
        success: false,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      };
      res.status(401).json(response);
    }
  };

  requireIdentity = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user?.identityId) {
      const response: APIResponse = {
        success: false,
        error: 'Digital identity required for this operation',
        timestamp: new Date().toISOString()
      };
      res.status(403).json(response);
      return;
    }
    next();
  };

  optional = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const user = await this.authService.verifyToken(token);
        req.user = {
          id: user.id,
          email: user.email,
          identityId: user.identityId
        };
      }
    } catch (error) {
      // Ignore errors for optional authentication
    }
    next();
  };
}