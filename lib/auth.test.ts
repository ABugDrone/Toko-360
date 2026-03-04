import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login, getAuthSession, clearAuthSession, setAuthSession } from './storage';
import * as supabaseService from './supabase-service';
import type { User, AuthSession } from './types';

// Mock the supabase-service module
vi.mock('./supabase-service', () => ({
  authenticateUser: vi.fn(),
}));

describe('Authentication Error Handling', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Invalid Credentials - Requirement 16.3', () => {
    it('should display error message for invalid staff ID', async () => {
      // Mock authenticateUser to return failure
      vi.mocked(supabaseService.authenticateUser).mockResolvedValue({
        success: false,
        error: {
          message: 'Invalid staff ID or password',
        },
      });

      const result = await login('INVALID-ID', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid staff ID or password');
      expect(result.user).toBeUndefined();
    });

    it('should display error message for invalid password', async () => {
      // Mock authenticateUser to return failure
      vi.mocked(supabaseService.authenticateUser).mockResolvedValue({
        success: false,
        error: {
          message: 'Invalid staff ID or password',
        },
      });

      const result = await login('TA-2024-001', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid staff ID or password');
      expect(result.user).toBeUndefined();
    });

    it('should not create session for invalid credentials', async () => {
      // Mock authenticateUser to return failure
      vi.mocked(supabaseService.authenticateUser).mockResolvedValue({
        success: false,
        error: {
          message: 'Invalid staff ID or password',
        },
      });

      await login('TA-2024-001', 'wrongpassword');

      const session = getAuthSession();
      expect(session).toBeNull();
    });

    it('should display error within 200ms for invalid credentials', async () => {
      // Mock authenticateUser to return failure quickly
      vi.mocked(supabaseService.authenticateUser).mockResolvedValue({
        success: false,
        error: {
          message: 'Invalid staff ID or password',
        },
      });

      const startTime = Date.now();
      const result = await login('TA-2024-001', 'wrongpassword');
      const endTime = Date.now();

      expect(result.success).toBe(false);
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('Database Connection Failure - Requirement 16.4, 25.1', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock authenticateUser to return connection error
      vi.mocked(supabaseService.authenticateUser).mockResolvedValue({
        success: false,
        error: {
          message: 'Unable to connect to database. Please try again.',
          code: 'PGRST116',
        },
      });

      const result = await login('TA-2024-001', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unable to connect to database. Please try again.');
    });

    it('should display user-friendly message for connection errors', async () => {
      // Mock authenticateUser to return connection error
      vi.mocked(supabaseService.authenticateUser).mockResolvedValue({
        success: false,
        error: {
          message: 'Unable to connect to database. Please try again.',
          code: 'PGRST116',
        },
      });

      const result = await login('TA-2024-001', 'password123');

      expect(result.error).toContain('Unable to connect to database');
      expect(result.error).toContain('Please try again');
    });

    it('should not create session when database connection fails', async () => {
      // Mock authenticateUser to return connection error
      vi.mocked(supabaseService.authenticateUser).mockResolvedValue({
        success: false,
        error: {
          message: 'Unable to connect to database. Please try again.',
          code: 'PGRST116',
        },
      });

      await login('TA-2024-001', 'password123');

      const session = getAuthSession();
      expect(session).toBeNull();
    });

    it('should handle timeout errors with appropriate message', async () => {
      // Mock authenticateUser to throw timeout error
      vi.mocked(supabaseService.authenticateUser).mockRejectedValue(
        new Error('Request timed out')
      );

      const result = await login('TA-2024-001', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock authenticateUser to throw unexpected error
      vi.mocked(supabaseService.authenticateUser).mockRejectedValue(
        new Error('Network error')
      );

      const result = await login('TA-2024-001', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('Session Expiration Handling - Requirement 25.1', () => {
    it('should return null for expired session', () => {
      // Create an expired session
      const expiredSession: AuthSession = {
        user: {
          id: '1',
          staffId: 'TA-2024-001',
          name: 'Test User',
          email: 'test@example.com',
          department: 'Engineering',
          role: 'staff',
          status: 'online',
        },
        token: 'expired-token',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      setAuthSession(expiredSession);

      const session = getAuthSession();
      expect(session).toBeNull();
    });

    it('should clear expired session from storage', () => {
      // Create an expired session
      const expiredSession: AuthSession = {
        user: {
          id: '1',
          staffId: 'TA-2024-001',
          name: 'Test User',
          email: 'test@example.com',
          department: 'Engineering',
          role: 'staff',
          status: 'online',
        },
        token: 'expired-token',
        expiresAt: Date.now() - 1000,
      };

      setAuthSession(expiredSession);
      getAuthSession(); // This should clear the expired session

      const storedSession = localStorage.getItem('toko_auth_session');
      expect(storedSession).toBeNull();
    });

    it('should return valid session when not expired', () => {
      // Create a valid session
      const validSession: AuthSession = {
        user: {
          id: '1',
          staffId: 'TA-2024-001',
          name: 'Test User',
          email: 'test@example.com',
          department: 'Engineering',
          role: 'staff',
          status: 'online',
        },
        token: 'valid-token',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // Expires in 24 hours
      };

      setAuthSession(validSession);

      const session = getAuthSession();
      expect(session).not.toBeNull();
      expect(session?.user.staffId).toBe('TA-2024-001');
      expect(session?.token).toBe('valid-token');
    });

    it('should handle corrupted session data gracefully', () => {
      // Set corrupted session data
      localStorage.setItem('toko_auth_session', 'invalid-json-data');

      const session = getAuthSession();
      expect(session).toBeNull();
    });

    it('should clear session on logout', () => {
      // Create a valid session
      const validSession: AuthSession = {
        user: {
          id: '1',
          staffId: 'TA-2024-001',
          name: 'Test User',
          email: 'test@example.com',
          department: 'Engineering',
          role: 'staff',
          status: 'online',
        },
        token: 'valid-token',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      setAuthSession(validSession);
      expect(getAuthSession()).not.toBeNull();

      clearAuthSession();
      expect(getAuthSession()).toBeNull();
    });
  });

  describe('Successful Authentication', () => {
    it('should create session for valid credentials', async () => {
      const mockUser: User = {
        id: '1',
        staffId: 'TA-2024-001',
        name: 'Test User',
        email: 'test@example.com',
        department: 'Engineering',
        role: 'staff',
        status: 'online',
      };

      // Mock authenticateUser to return success
      vi.mocked(supabaseService.authenticateUser).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const result = await login('TA-2024-001', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeUndefined();

      const session = getAuthSession();
      expect(session).not.toBeNull();
      expect(session?.user).toEqual(mockUser);
    });

    it('should set session expiration to 24 hours', async () => {
      const mockUser: User = {
        id: '1',
        staffId: 'TA-2024-001',
        name: 'Test User',
        email: 'test@example.com',
        department: 'Engineering',
        role: 'staff',
        status: 'online',
      };

      vi.mocked(supabaseService.authenticateUser).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const beforeLogin = Date.now();
      await login('TA-2024-001', 'password123');
      const afterLogin = Date.now();

      const session = getAuthSession();
      expect(session).not.toBeNull();
      
      const expectedExpiration = 24 * 60 * 60 * 1000; // 24 hours in ms
      const actualExpiration = session!.expiresAt - beforeLogin;
      
      // Allow for small time difference during test execution
      expect(actualExpiration).toBeGreaterThanOrEqual(expectedExpiration - 1000);
      expect(actualExpiration).toBeLessThanOrEqual(expectedExpiration + (afterLogin - beforeLogin));
    });
  });
});
