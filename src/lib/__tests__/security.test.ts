import {
  validatePassword,
  sanitizeInput,
  isAllowedFileType,
  isFileSizeAllowed,
} from '@/config/security';

describe('Security Utilities', () => {
  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      const result = validatePassword('StrongP@ssw0rd');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject passwords that are too short', () => {
      const result = validatePassword('Sh0rt!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('weakp@ssw0rd');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('STRONGP@SSW0RD');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('StrongP@ssword');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const result = validatePassword('StrongPassw0rd');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return multiple errors for very weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });

    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput('Hello <b>world</b>')).toBe('Hello bworld/b');
    });

    it('should limit input length', () => {
      const longInput = 'a'.repeat(2000);
      expect(sanitizeInput(longInput)).toHaveLength(1000);
    });

    it('should handle normal input unchanged', () => {
      const normalInput = 'This is a normal message!';
      expect(sanitizeInput(normalInput)).toBe(normalInput);
    });
  });

  describe('isAllowedFileType', () => {
    it('should allow valid image types', () => {
      expect(isAllowedFileType('image/jpeg')).toBe(true);
      expect(isAllowedFileType('image/png')).toBe(true);
      expect(isAllowedFileType('image/gif')).toBe(true);
      expect(isAllowedFileType('image/webp')).toBe(true);
    });

    it('should reject invalid file types', () => {
      expect(isAllowedFileType('application/pdf')).toBe(false);
      expect(isAllowedFileType('text/plain')).toBe(false);
      expect(isAllowedFileType('application/javascript')).toBe(false);
    });
  });

  describe('isFileSizeAllowed', () => {
    it('should allow files under 10MB', () => {
      expect(isFileSizeAllowed(5 * 1024 * 1024)).toBe(true); // 5MB
      expect(isFileSizeAllowed(9.9 * 1024 * 1024)).toBe(true); // 9.9MB
    });

    it('should reject files over 10MB', () => {
      expect(isFileSizeAllowed(11 * 1024 * 1024)).toBe(false); // 11MB
      expect(isFileSizeAllowed(100 * 1024 * 1024)).toBe(false); // 100MB
    });

    it('should allow exactly 10MB', () => {
      expect(isFileSizeAllowed(10 * 1024 * 1024)).toBe(true); // 10MB
    });
  });
});
