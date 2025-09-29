import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../types/identity';
import { User as UserModel } from '../models/User';
import winston from 'winston';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  identityId?: string;
}

export class AuthService {
  private logger: winston.Logger;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'auth.log' })
      ]
    });

    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    additionalProfile?: any
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = uuidv4();
      const user: User = {
        id: userId,
        email,
        passwordHash,
        profile: {
          firstName,
          lastName,
          ...additionalProfile
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const userDoc = new UserModel(user);
      await userDoc.save();

      // Generate tokens
      const authUser: AuthUser = {
        id: userId,
        email,
        profile: {
          firstName,
          lastName
        }
      };

      const tokens = this.generateTokens(authUser);

      this.logger.info(`User registered: ${email}`);
      return { user: authUser, tokens };

    } catch (error) {
      this.logger.error('Failed to register user:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    try {
      // Find user
      const user = await UserModel.findOne({ email, isActive: true });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Create auth user object
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        profile: {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName
        },
        identityId: user.identityId
      };

      // Generate tokens
      const tokens = this.generateTokens(authUser);

      this.logger.info(`User logged in: ${email}`);
      return { user: authUser, tokens };

    } catch (error) {
      this.logger.error('Failed to login user:', error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<AuthUser> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Fetch fresh user data
      const user = await UserModel.findOne({ id: decoded.id, isActive: true });
      if (!user) {
        throw new Error('User not found or inactive');
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        profile: {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName
        },
        identityId: user.identityId
      };

      return authUser;

    } catch (error) {
      this.logger.error('Failed to verify token:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as any;
      
      // Verify user still exists and is active
      const user = await UserModel.findOne({ id: decoded.id, isActive: true });
      if (!user) {
        throw new Error('User not found or inactive');
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        profile: {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName
        },
        identityId: user.identityId
      };

      return this.generateTokens(authUser);

    } catch (error) {
      this.logger.error('Failed to refresh token:', error);
      throw error;
    }
  }

  async updateProfile(
    userId: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      dateOfBirth: Date;
      address: any;
      phoneNumber: string;
    }>
  ): Promise<AuthUser> {
    try {
      const user = await UserModel.findOne({ id: userId, isActive: true });
      if (!user) {
        throw new Error('User not found');
      }

      // Update profile fields
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof typeof updates] !== undefined) {
          (user.profile as any)[key] = updates[key as keyof typeof updates];
        }
      });

      user.updatedAt = new Date();
      await user.save();

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        profile: {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName
        },
        identityId: user.identityId
      };

      this.logger.info(`Profile updated for user: ${userId}`);
      return authUser;

    } catch (error) {
      this.logger.error('Failed to update profile:', error);
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await UserModel.findOne({ id: userId, isActive: true });
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.passwordHash = newPasswordHash;
      user.updatedAt = new Date();
      await user.save();

      this.logger.info(`Password changed for user: ${userId}`);

    } catch (error) {
      this.logger.error('Failed to change password:', error);
      throw error;
    }
  }

  private generateTokens(user: AuthUser): AuthTokens {
    const payload = {
      id: user.id,
      email: user.email,
      identityId: user.identityId
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '30d'
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }
}