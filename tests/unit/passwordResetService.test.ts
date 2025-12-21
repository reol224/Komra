import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock bcryptjs
const mockHash = vi.fn();
vi.mock('bcryptjs', () => ({
  default: {
    hash: (password: string, saltRounds: number) => mockHash(password, saltRounds),
  },
}));

// Mock Supabase
interface MockFns {
  from: ReturnType<typeof vi.fn>;
}

vi.mock('@supabase/supabase-js', () => {
  const from = vi.fn();

  (global as any).__supabasePasswordResetMocks = {
    from,
  };

  return {
    createClient: () => ({
      from,
    }),
  };
});

// Import after mocking
import {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  adminResetUserPassword,
} from '@/lib/passwordResetService';

// Helper to get mocks
const getMocks = () => (global as any).__supabasePasswordResetMocks as MockFns;

describe('passwordResetService', () => {
  let mocks: MockFns;

  beforeEach(() => {
    mocks = getMocks();
    vi.clearAllMocks();
    mockHash.mockResolvedValue('hashed_password');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('should return success message even when user does not exist (security)', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const result = await requestPasswordReset('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account exists with this email');

      consoleSpy.mockRestore();
    });

    it('should generate and store reset token when user exists', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      let updateCalled = false;
      let updateData: any = null;

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
            update: (data: any) => {
              updateCalled = true;
              updateData = data;
              return {
                eq: () => Promise.resolve({ error: null }),
              };
            },
          };
        }
        return {};
      });

      const result = await requestPasswordReset('test@example.com');

      expect(result.success).toBe(true);
      expect(updateCalled).toBe(true);
      expect(updateData.reset_token).toBeDefined();
      expect(updateData.reset_token_expiry).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should return failure when storing reset token fails', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
            update: () => ({
              eq: () => Promise.resolve({ error: { message: 'Database error' } }),
            }),
          };
        }
        return {};
      });

      const result = await requestPasswordReset('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to process password reset request');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle unexpected exceptions', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await requestPasswordReset('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('An error occurred');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('verifyResetToken', () => {
    it('should return valid:false when token not found', async () => {
      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const result = await verifyResetToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
    });

    it('should return valid:false when token is expired', async () => {
      const expiredDate = new Date(Date.now() - 3600000); // 1 hour ago

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'user-123',
                reset_token: 'valid-token',
                reset_token_expiry: expiredDate.toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await verifyResetToken('valid-token');

      expect(result.valid).toBe(false);
    });

    it('should return valid:true with userId when token is valid', async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'user-123',
                reset_token: 'valid-token',
                reset_token_expiry: futureDate.toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await verifyResetToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    it('should handle exceptions gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await verifyResetToken('any-token');

      expect(result.valid).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('resetPassword', () => {
    it('should return failure when token is invalid', async () => {
      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const result = await resetPassword('invalid-token', 'NewPassword123!');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid or expired reset token');
    });

    it('should reset password successfully with valid token', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const futureDate = new Date(Date.now() + 3600000);
      let passwordUpdateCalled = false;
      let updateData: any = null;

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: 'user-123',
                    reset_token: 'valid-token',
                    reset_token_expiry: futureDate.toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            update: (data: any) => {
              passwordUpdateCalled = true;
              updateData = data;
              return {
                eq: () => Promise.resolve({ error: null }),
              };
            },
          };
        }
        return {};
      });

      const result = await resetPassword('valid-token', 'NewPassword123!');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Password has been reset successfully');
      expect(passwordUpdateCalled).toBe(true);
      expect(updateData.password_hash).toBe('hashed_password');
      expect(updateData.reset_token).toBeNull();
      expect(updateData.reset_token_expiry).toBeNull();
      expect(mockHash).toHaveBeenCalledWith('NewPassword123!', 12);

      consoleSpy.mockRestore();
    });

    it('should return failure when password update fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const futureDate = new Date(Date.now() + 3600000);

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: 'user-123',
                    reset_token: 'valid-token',
                    reset_token_expiry: futureDate.toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: () => Promise.resolve({ error: { message: 'Update failed' } }),
            }),
          };
        }
        return {};
      });

      const result = await resetPassword('valid-token', 'NewPassword123!');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to reset password');

      consoleErrorSpy.mockRestore();
    });

    it('should handle exceptions during password reset', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const futureDate = new Date(Date.now() + 3600000);

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: 'user-123',
                    reset_token: 'valid-token',
                    reset_token_expiry: futureDate.toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            update: () => {
              throw new Error('Unexpected error');
            },
          };
        }
        return {};
      });

      const result = await resetPassword('valid-token', 'NewPassword123!');

      expect(result.success).toBe(false);
      expect(result.message).toContain('An error occurred');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('adminResetUserPassword', () => {
    it('should return failure when admin user not found', async () => {
      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const result = await adminResetUserPassword('user-456', 'NewPassword123!', 'admin-123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('should return failure when user is not admin', async () => {
      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { role: 'analyst' }, error: null }),
          }),
        }),
      });

      const result = await adminResetUserPassword('user-456', 'NewPassword123!', 'analyst-123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('should reset password when admin is authorized', async () => {
      let passwordUpdateCalled = false;
      let auditLogCalled = false;
      let updateData: any = null;

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { role: 'admin' }, error: null }),
              }),
            }),
            update: (data: any) => {
              passwordUpdateCalled = true;
              updateData = data;
              return {
                eq: () => Promise.resolve({ error: null }),
              };
            },
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: () => {
              auditLogCalled = true;
              return Promise.resolve({ error: null });
            },
          };
        }
        return {};
      });

      const result = await adminResetUserPassword('user-456', 'NewPassword123!', 'admin-123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Password has been reset successfully');
      expect(passwordUpdateCalled).toBe(true);
      expect(auditLogCalled).toBe(true);
      expect(updateData.password_hash).toBe('hashed_password');
      expect(mockHash).toHaveBeenCalledWith('NewPassword123!', 12);
    });

    it('should return failure when password update fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { role: 'admin' }, error: null }),
              }),
            }),
            update: () => ({
              eq: () => Promise.resolve({ error: { message: 'Update failed' } }),
            }),
          };
        }
        return {};
      });

      const result = await adminResetUserPassword('user-456', 'NewPassword123!', 'admin-123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to reset password');

      consoleErrorSpy.mockRestore();
    });

    it('should handle exceptions during admin reset', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockImplementation(() => {
        throw new Error('Database connection error');
      });

      const result = await adminResetUserPassword('user-456', 'NewPassword123!', 'admin-123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('An error occurred');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Password Hashing', () => {
    it('should use bcrypt with 12 salt rounds', async () => {
      const futureDate = new Date(Date.now() + 3600000);

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: 'user-123',
                    reset_token: 'valid-token',
                    reset_token_expiry: futureDate.toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          };
        }
        return {};
      });

      await resetPassword('valid-token', 'TestPassword123!');

      expect(mockHash).toHaveBeenCalledWith('TestPassword123!', 12);
    });
  });

  describe('Token Expiry', () => {
    it('should generate token with 1 hour expiry', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      let capturedExpiry: string = '';

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
            update: (data: any) => {
              capturedExpiry = data.reset_token_expiry;
              return {
                eq: () => Promise.resolve({ error: null }),
              };
            },
          };
        }
        return {};
      });

      const before = Date.now();
      await requestPasswordReset('test@example.com');
      const after = Date.now();

      const expiryTime = new Date(capturedExpiry).getTime();
      const expectedMinExpiry = before + 3600000;
      const expectedMaxExpiry = after + 3600000;

      expect(expiryTime).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(expiryTime).toBeLessThanOrEqual(expectedMaxExpiry);

      consoleSpy.mockRestore();
    });
  });
});
