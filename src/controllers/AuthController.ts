import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { APIResponse } from '../types/api';
import { asyncHandler } from '../middleware/error';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, firstName, lastName, ...additionalProfile } = req.body;

    const result = await this.authService.register(
      email,
      password,
      firstName,
      lastName,
      additionalProfile
    );

    const response: APIResponse = {
      success: true,
      data: result,
      message: 'User registered successfully',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const result = await this.authService.login(email, password);

    const response: APIResponse = {
      success: true,
      data: result,
      message: 'Login successful',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const response: APIResponse = {
        success: false,
        error: 'Refresh token is required',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    const tokens = await this.authService.refreshToken(refreshToken);

    const response: APIResponse = {
      success: true,
      data: tokens,
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });

  getProfile = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const user = await this.authService.verifyToken(req.headers.authorization?.substring(7));

    const response: APIResponse = {
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });

  updateProfile = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const userId = req.user.id;
    const updates = req.body;

    const user = await this.authService.updateProfile(userId, updates);

    const response: APIResponse = {
      success: true,
      data: user,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });

  changePassword = asyncHandler(async (req: any, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    await this.authService.changePassword(userId, currentPassword, newPassword);

    const response: APIResponse = {
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  });
}