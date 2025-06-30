import { hashPassword, verifyPassword, validatePassword } from '@/lib/auth/password';

describe('Password utilities', () => {
  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should require uppercase letters', () => {
      const result = validatePassword('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letters', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require numbers', () => {
      const result = validatePassword('StrongPass!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should require special characters', () => {
      const result = validatePassword('StrongPass123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('hashPassword and verifyPassword', () => {
    it('should hash and verify passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);

      // Both should still verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });
});
