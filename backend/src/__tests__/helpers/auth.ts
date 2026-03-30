import { generateToken } from '../../utils/jwt';
import { User } from '../../models';
import { hashPassword } from '../../utils/password';

export async function createTestUser(overrides = {}) {
  return User.create({
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    password_hash: await hashPassword('password123'),
    ...overrides,
  });
}

export function getAuthToken(userId: string, email: string): string {
  return generateToken({ userId, email });
}

export async function createAuthenticatedUser() {
  const user = await createTestUser();
  const token = getAuthToken(user.id, user.email);
  return { user, token };
}
