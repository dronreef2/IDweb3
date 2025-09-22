import { CryptoUtils, ValidationUtils, DateUtils } from '../../src/utils/helpers';

describe('CryptoUtils', () => {
  test('should generate random string', () => {
    const randomString = CryptoUtils.generateRandomString(16);
    expect(randomString).toHaveLength(32); // hex encoding doubles the length
    expect(randomString).toMatch(/^[a-f0-9]+$/);
  });

  test('should hash string with SHA-256', () => {
    const data = 'test data';
    const hash = CryptoUtils.sha256(data);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  test('should generate key pair', () => {
    const keyPair = CryptoUtils.generateKeyPair();
    expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
  });

  test('should generate valid DID', () => {
    const did = CryptoUtils.generateDID('hedera', 'testnet', '123456');
    expect(did).toBe('did:hedera:testnet:123456');
  });

  test('should validate DID format', () => {
    expect(CryptoUtils.validateDID('did:hedera:testnet:123456')).toBe(true);
    expect(CryptoUtils.validateDID('invalid-did')).toBe(false);
  });

  test('should generate document hash', () => {
    const document = Buffer.from('test document content');
    const hash = CryptoUtils.generateDocumentHash(document);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  test('should generate UUID', () => {
    const uuid = CryptoUtils.generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});

describe('ValidationUtils', () => {
  test('should validate email addresses', () => {
    expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
    expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false);
    expect(ValidationUtils.isValidEmail('test@')).toBe(false);
  });

  test('should validate password strength', () => {
    expect(ValidationUtils.isValidPassword('StrongPass123!')).toBe(true);
    expect(ValidationUtils.isValidPassword('weakpass')).toBe(false);
    expect(ValidationUtils.isValidPassword('NoNumbers!')).toBe(false);
  });

  test('should validate UUID format', () => {
    const validUuid = CryptoUtils.generateUUID();
    expect(ValidationUtils.isValidUUID(validUuid)).toBe(true);
    expect(ValidationUtils.isValidUUID('invalid-uuid')).toBe(false);
  });

  test('should validate hex strings', () => {
    expect(ValidationUtils.isValidHex('abcdef123456')).toBe(true);
    expect(ValidationUtils.isValidHex('xyz123')).toBe(false);
    expect(ValidationUtils.isValidHex('abcd', 4)).toBe(true);
    expect(ValidationUtils.isValidHex('abcdef', 4)).toBe(false);
  });

  test('should sanitize strings', () => {
    expect(ValidationUtils.sanitizeString('  <script>alert("xss")</script>  ')).toBe('scriptalert("xss")/script');
    expect(ValidationUtils.sanitizeString('  normal text  ')).toBe('normal text');
  });
});

describe('DateUtils', () => {
  test('should format date to ISO string', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    expect(DateUtils.toISOString(date)).toBe('2023-01-01T00:00:00.000Z');
  });

  test('should check if date is expired', () => {
    const pastDate = new Date(Date.now() - 86400000); // 1 day ago
    const futureDate = new Date(Date.now() + 86400000); // 1 day from now
    
    expect(DateUtils.isExpired(pastDate)).toBe(true);
    expect(DateUtils.isExpired(futureDate)).toBe(false);
  });

  test('should add days to date', () => {
    const baseDate = new Date('2023-01-01');
    const newDate = DateUtils.addDays(baseDate, 5);
    expect(newDate.getDate()).toBe(6);
  });

  test('should format duration', () => {
    expect(DateUtils.formatDuration(1000)).toBe('1s');
    expect(DateUtils.formatDuration(60000)).toBe('1m 0s');
    expect(DateUtils.formatDuration(3600000)).toBe('1h 0m');
    expect(DateUtils.formatDuration(86400000)).toBe('1d 0h');
  });
});