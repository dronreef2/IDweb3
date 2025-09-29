import crypto from 'crypto';

export class CryptoUtils {
  
  /**
   * Generate a secure random string
   */
  static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a string using SHA-256
   */
  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /**
   * Generate a key pair for Ed25519
   */
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const keyPair = crypto.generateKeyPairSync('ed25519');
    
    return {
      publicKey: keyPair.publicKey.export({ type: 'spki', format: 'pem' }) as string,
      privateKey: keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string
    };
  }

  /**
   * Sign data with a private key
   */
  static sign(data: string, privateKey: string): string {
    const sign = crypto.createSign('ed25519');
    sign.update(data);
    return sign.sign(privateKey, 'hex');
  }

  /**
   * Verify signature with public key
   */
  static verify(data: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('ed25519');
      verify.update(data);
      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a DID from account ID and identifier
   */
  static generateDID(method: string, network: string, identifier: string): string {
    return `did:${method}:${network}:${identifier}`;
  }

  /**
   * Validate DID format
   */
  static validateDID(did: string): boolean {
    const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/;
    return didRegex.test(did);
  }

  /**
   * Generate a secure document hash
   */
  static generateDocumentHash(document: Buffer): string {
    return crypto.createHash('sha256').update(document).digest('hex');
  }

  /**
   * Generate a UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static encrypt(data: string, key: string): { 
    encrypted: string; 
    iv: string; 
    tag: string; 
  } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decrypt(encryptedData: string, key: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

export class ValidationUtils {
  
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number, one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate hex string
   */
  static isValidHex(hex: string, length?: number): boolean {
    const hexRegex = length ? 
      new RegExp(`^[a-fA-F0-9]{${length}}$`) : 
      /^[a-fA-F0-9]+$/;
    return hexRegex.test(hex);
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
}

export class DateUtils {
  
  /**
   * Format date to ISO string
   */
  static toISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Check if date is expired
   */
  static isExpired(expirationDate: string | Date): boolean {
    const expDate = new Date(expirationDate);
    return expDate < new Date();
  }

  /**
   * Add days to date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Format duration in milliseconds to human readable
   */
  static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}