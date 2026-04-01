/**
 * Tests for Error Handling Utilities
 * Requirements: 25.1, 25.2, 25.3, 25.4, 25.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapDatabaseError,
  retryOperation,
  logError,
  logSuccess,
  withErrorHandling,
  handleAuthError,
  handleDuplicateError,
  isRetryableError,
  type DatabaseError
} from './error-handler';

describe('Error Handler Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('mapDatabaseError', () => {
    it('should map connection error to user-friendly message (Requirement 25.1)', () => {
      const error = { code: 'PGRST116', message: 'Connection failed' };
      const result = mapDatabaseError(error);

      expect(result.message).toBe('Unable to connect to database. Please try again.');
      expect(result.code).toBe('PGRST116');
      expect(result.retryable).toBe(true);
    });

    it('should map timeout error to user-friendly message (Requirement 25.2)', () => {
      const error = { code: 'TIMEOUT', message: 'Request timeout' };
      const result = mapDatabaseError(error);

      expect(result.message).toBe('Request timed out. Please check your connection.');
      expect(result.code).toBe('TIMEOUT');
      expect(result.retryable).toBe(true);
    });

    it('should map unique constraint violation (Requirement 25.3)', () => {
      const error = { code: '23505', message: 'Duplicate key' };
      const result = mapDatabaseError(error);

      expect(result.message).toBe('This record already exists.');
      expect(result.code).toBe('23505');
      expect(result.retryable).toBe(false);
    });

    it('should map foreign key constraint violation (Requirement 25.4)', () => {
      const error = { code: '23503', message: 'Foreign key violation' };
      const result = mapDatabaseError(error);

      expect(result.message).toBe('Referenced record not found.');
      expect(result.code).toBe('23503');
      expect(result.retryable).toBe(false);
    });

    it('should log errors to console (Requirement 25.5)', () => {
      const error = { code: 'TEST_ERROR', message: 'Test error' };
      mapDatabaseError(error);

      expect(console.error).toHaveBeenCalledWith(
        '[Database Error]',
        expect.objectContaining({
          code: 'TEST_ERROR',
          message: 'Test error'
        })
      );
    });

    it('should handle unknown errors with default message', () => {
      const error = { code: 'UNKNOWN', message: 'Unknown error' };
      const result = mapDatabaseError(error);

      expect(result.message).toBe('Unknown error');
      expect(result.retryable).toBe(true);
    });

    it('should handle errors without code', () => {
      const error = { message: 'Generic error' };
      const result = mapDatabaseError(error);

      expect(result.message).toBe('Generic error');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('retryOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await retryOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce({ code: 'TIMEOUT', message: 'Timeout' })
        .mockResolvedValueOnce('success');

      const result = await retryOperation(operation, { 
        maxAttempts: 3, 
        delayMs: 10 
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValue({ code: '23505', message: 'Duplicate' });

      await expect(
        retryOperation(operation, { maxAttempts: 3, delayMs: 10 })
      ).rejects.toMatchObject({ code: '23505' });

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw after max attempts', async () => {
      const operation = vi.fn()
        .mockRejectedValue({ code: 'TIMEOUT', message: 'Timeout' });

      await expect(
        retryOperation(operation, { maxAttempts: 2, delayMs: 10 })
      ).rejects.toMatchObject({ code: 'TIMEOUT' });

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce({ code: 'TIMEOUT' })
        .mockRejectedValueOnce({ code: 'TIMEOUT' })
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      await retryOperation(operation, { 
        maxAttempts: 3, 
        delayMs: 50,
        backoffMultiplier: 2
      });
      const duration = Date.now() - startTime;

      // Should wait 50ms + 100ms = 150ms minimum
      expect(duration).toBeGreaterThanOrEqual(140);
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('logError', () => {
    it('should log error with context and timestamp', () => {
      const error = new Error('Test error');
      logError('TestContext', error, { userId: '123' });

      expect(console.error).toHaveBeenCalledWith(
        '[Error: TestContext]',
        expect.objectContaining({
          context: 'TestContext',
          userId: '123',
          error: expect.objectContaining({
            message: 'Test error'
          })
        })
      );
    });
  });

  describe('logSuccess', () => {
    it('should log success with context and timestamp', () => {
      logSuccess('TestContext', 'Operation successful', { recordId: '456' });

      expect(console.log).toHaveBeenCalledWith(
        '[Success: TestContext]',
        expect.objectContaining({
          context: 'TestContext',
          message: 'Operation successful',
          recordId: '456'
        })
      );
    });
  });

  describe('withErrorHandling', () => {
    it('should execute operation successfully', async () => {
      const operation = vi.fn().mockResolvedValue('result');
      const result = await withErrorHandling(operation, 'TestOp');

      expect(result).toBe('result');
      expect(console.log).toHaveBeenCalledWith(
        '[Success: TestOp]',
        expect.any(Object)
      );
    });

    it('should handle errors and call onError callback', async () => {
      const operation = vi.fn().mockRejectedValue({ 
        code: '23505', 
        message: 'Duplicate' 
      });
      const onError = vi.fn();

      await expect(
        withErrorHandling(operation, 'TestOp', { onError })
      ).rejects.toMatchObject({
        message: 'This record already exists.'
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'This record already exists.',
          code: '23505'
        })
      );
    });

    it('should retry when retry option is enabled', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce({ code: 'TIMEOUT' })
        .mockResolvedValueOnce('success');

      const result = await withErrorHandling(operation, 'TestOp', {
        retry: true,
        retryOptions: { maxAttempts: 2, delayMs: 10 }
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleAuthError', () => {
    it('should customize message for authentication errors', () => {
      const error = { code: '28P01', message: 'Auth failed' };
      const result = handleAuthError(error);

      expect(result.message).toBe('Invalid staff ID or password');
    });

    it('should handle generic auth errors', () => {
      const error = { message: 'Invalid credentials' };
      const result = handleAuthError(error);

      expect(result.message).toBe('Invalid staff ID or password');
    });
  });

  describe('handleDuplicateError', () => {
    it('should customize message with record type', () => {
      const error = { code: '23505', message: 'Duplicate' };
      const result = handleDuplicateError(error, 'attendance record');

      expect(result.message).toBe('This attendance record already exists.');
    });

    it('should pass through non-duplicate errors', () => {
      const error = { code: 'TIMEOUT', message: 'Timeout' };
      const result = handleDuplicateError(error, 'record');

      expect(result.message).toBe('Request timed out. Please check your connection.');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      const error = { code: 'TIMEOUT' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error = { code: '23505' };
      expect(isRetryableError(error)).toBe(false);
    });
  });
});
