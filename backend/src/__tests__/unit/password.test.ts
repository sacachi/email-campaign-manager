import { hashPassword, comparePassword } from '../../utils/password';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should return a hash different from original password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
    });

    it('should generate different hashes for same password (salt)', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await hashPassword(password);
      const result = await comparePassword(wrongPassword, hash);
      expect(result).toBe(false);
    });
  });
});
