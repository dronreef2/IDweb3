import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { APIResponse } from '../types/api';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: APIResponse = {
      success: false,
      error: 'Validation failed',
      data: errors.array(),
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }
  next();
};

export const validateRegister: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
];

export const validateLogin: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateCreateIdentity: ValidationChain[] = [
  body('userProfile.firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required'),
  body('userProfile.lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required'),
  body('userProfile.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('userProfile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('userProfile.address.street')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Street address must be provided'),
  body('userProfile.address.city')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('City must be provided'),
  body('userProfile.address.state')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('State must be provided'),
  body('userProfile.address.country')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Country must be provided'),
  body('userProfile.address.postalCode')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Postal code must be provided')
];

export const validateIssueCredential: ValidationChain[] = [
  body('identityId')
    .isUUID()
    .withMessage('Valid identity ID is required'),
  body('credentialType')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Credential type is required'),
  body('claims')
    .isObject()
    .withMessage('Claims must be an object'),
  body('expirationDate')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid date')
];

export const validateSignDocument: ValidationChain[] = [
  body('documentHash')
    .matches(/^[a-fA-F0-9]{64}$/)
    .withMessage('Document hash must be a valid SHA-256 hash'),
  body('identityId')
    .isUUID()
    .withMessage('Valid identity ID is required'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

export const validateVerifyCredential: ValidationChain[] = [
  body('credential')
    .isObject()
    .withMessage('Credential must be an object'),
  body('challenge')
    .optional()
    .isString()
    .withMessage('Challenge must be a string')
];