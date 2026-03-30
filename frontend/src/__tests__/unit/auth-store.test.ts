import { describe, it, expect } from 'vitest';
import { useAuthStore } from '../../store/auth.store';

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('initial state has null token', () => {
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it('setAuth stores token and user', () => {
    const { setAuth } = useAuthStore.getState();
    const testUser = { id: '1', email: 'test@test.com', name: 'Test' };
    
    setAuth('test-token', testUser);
    
    const { token, user } = useAuthStore.getState();
    expect(token).toBe('test-token');
    expect(user).toEqual(testUser);
  });

  it('clearAuth clears state', () => {
    const { setAuth, clearAuth } = useAuthStore.getState();
    setAuth('test-token', { id: '1', email: 'test@test.com', name: 'Test' });
    
    clearAuth();
    
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it('isAuthenticated returns true when token exists', () => {
    const { setAuth, isAuthenticated } = useAuthStore.getState();
    setAuth('test-token', { id: '1', email: 'test@test.com', name: 'Test' });
    expect(isAuthenticated()).toBe(true);
  });

  it('isAuthenticated returns false when token is null', () => {
    const { isAuthenticated } = useAuthStore.getState();
    expect(isAuthenticated()).toBe(false);
  });
});
