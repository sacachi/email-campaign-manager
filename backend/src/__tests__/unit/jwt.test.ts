import { generateToken, verifyToken } from '../../utils/jwt';

describe('JWT Utils', () => {
  describe('generateToken', () => {
    it('should return a valid JWT string', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId and email in payload', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe('123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should set expiration', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      const decoded = verifyToken(token) as any;
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    it('should decode valid token correctly', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw on invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow();
    });

    it('should throw on tampered token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      expect(() => verifyToken(tamperedToken)).toThrow();
    });
  });
});
