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

  (global as any).__supabasePasswordResetIntegrationMocks = {
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
const getMocks = () => (global as any).__supabasePasswordResetIntegrationMocks as MockFns;

describe('Password Reset Service Integration Tests', () => {
  let mocks: MockFns;

  beforeEach(() => {
    mocks = getMocks();
    vi.clearAllMocks();
    mockHash.mockResolvedValue('hashed_password_value');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Password Reset Flow', () => {
    it('should complete full password reset workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockUser = { id: 'user-123', email: 'user@company.com' };
      let storedToken: string = '';
      let storedExpiry: string = '';
      let passwordUpdated = false;
      let tokenCleared = false;

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: (columns: string) => {
              if (columns.includes('reset_token_expiry')) {
                return {
                  eq: () => ({
                    single: () => {
                      if (storedToken) {
                        return Promise.resolve({
                          data: {
                            id: mockUser.id,
                            reset_token: storedToken,
                            reset_token_expiry: storedExpiry,
                          },
                          error: null,
                        });
                      }
                      return Promise.resolve({ data: null, error: { message: 'Not found' } });
                    },
                  }),
                };
              }
              return {
                eq: () => ({
                  single: () => Promise.resolve({ data: mockUser, error: null }),
                }),
              };
            },
            update: (data: any) => {
              if (data.reset_token !== undefined) {
                if (data.reset_token === null) {
                  tokenCleared = true;
                } else {
                  storedToken = data.reset_token;
                  storedExpiry = data.reset_token_expiry;
                }
              }
              if (data.password_hash) {
                passwordUpdated = true;
              }
              return {
                eq: () => Promise.resolve({ error: null }),
              };
            },
          };
        }
        return {};
      });

      // Step 1: Request password reset
      const requestResult = await requestPasswordReset('user@company.com');
      expect(requestResult.success).toBe(true);
      expect(storedToken).toBeTruthy();

      // Step 2: Verify the token
      const verifyResult = await verifyResetToken(storedToken);
      expect(verifyResult.valid).toBe(true);
      expect(verifyResult.userId).toBe('user-123');

      // Step 3: Reset the password
      const resetResult = await resetPassword(storedToken, 'NewSecurePassword123!');
      expect(resetResult.success).toBe(true);
      expect(passwordUpdated).toBe(true);
      expect(tokenCleared).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should prevent password reset with expired token', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockUser = { id: 'user-123', email: 'user@company.com' };
      const expiredDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: (columns: string) => {
              if (columns.includes('reset_token_expiry')) {
                return {
                  eq: () => ({
                    single: () => Promise.resolve({
                      data: {
                        id: mockUser.id,
                        reset_token: 'expired-token',
                        reset_token_expiry: expiredDate,
                      },
                      error: null,
                    }),
                  }),
                };
              }
              return {
                eq: () => ({
                  single: () => Promise.resolve({ data: mockUser, error: null }),
                }),
              };
            },
            update: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          };
        }
        return {};
      });

      // Attempt to verify expired token
      const verifyResult = await verifyResetToken('expired-token');
      expect(verifyResult.valid).toBe(false);

      // Attempt to reset with expired token
      const resetResult = await resetPassword('expired-token', 'NewPassword123!');
      expect(resetResult.success).toBe(false);
      expect(resetResult.message).toContain('Invalid or expired');

      consoleSpy.mockRestore();
    });

    it('should prevent password reset with invalid token', async () => {
      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const verifyResult = await verifyResetToken('fake-token');
      expect(verifyResult.valid).toBe(false);

      const resetResult = await resetPassword('fake-token', 'NewPassword123!');
      expect(resetResult.success).toBe(false);
    });
  });

  describe('Admin Password Reset Flow', () => {
    it('should complete admin password reset workflow', async () => {
      const mockAdmin = { id: 'admin-123', role: 'admin' };
      const mockTargetUser = { id: 'user-456', email: 'employee@company.com' };
      let passwordUpdated = false;
      let auditLogged = false;
      let auditDetails: any = null;

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: (field: string, value: string) => ({
                single: () => {
                  if (value === 'admin-123') {
                    return Promise.resolve({ data: mockAdmin, error: null });
                  }
                  return Promise.resolve({ data: mockTargetUser, error: null });
                },
              }),
            }),
            update: () => {
              passwordUpdated = true;
              return {
                eq: () => Promise.resolve({ error: null }),
              };
            },
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: (data: any) => {
              auditLogged = true;
              auditDetails = data;
              return Promise.resolve({ error: null });
            },
          };
        }
        return {};
      });

      const result = await adminResetUserPassword('user-456', 'AdminSetPassword123!', 'admin-123');

      expect(result.success).toBe(true);
      expect(passwordUpdated).toBe(true);
      expect(auditLogged).toBe(true);
      expect(auditDetails.action).toBe('admin_password_reset');
      expect(auditDetails.user_id).toBe('admin-123');
      expect(auditDetails.resource_id).toBe('user-456');
    });

    it('should prevent non-admin from resetting passwords', async () => {
      const rolesWithoutAccess = ['analyst', 'viewer', 'user'];

      for (const role of rolesWithoutAccess) {
        mocks.from.mockReturnValue({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { role }, error: null }),
            }),
          }),
        });

        const result = await adminResetUserPassword('user-456', 'NewPassword123!', `${role}-123`);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Unauthorized');
      }
    });

    it('should handle admin resetting multiple user passwords', async () => {
      const mockAdmin = { id: 'admin-123', role: 'admin' };
      let resetCount = 0;
      let auditCount = 0;

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockAdmin, error: null }),
              }),
            }),
            update: () => {
              resetCount++;
              return {
                eq: () => Promise.resolve({ error: null }),
              };
            },
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: () => {
              auditCount++;
              return Promise.resolve({ error: null });
            },
          };
        }
        return {};
      });

      const users = ['user-1', 'user-2', 'user-3'];

      for (const userId of users) {
        const result = await adminResetUserPassword(userId, 'TempPassword123!', 'admin-123');
        expect(result.success).toBe(true);
      }

      expect(resetCount).toBe(3);
      expect(auditCount).toBe(3);
    });
  });

  describe('Security Scenarios', () => {
    it('should not reveal if email exists during password reset request', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Test with existing user
      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'user-123', email: 'exists@example.com' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });

      const existsResult = await requestPasswordReset('exists@example.com');

      // Test with non-existing user
      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const notExistsResult = await requestPasswordReset('notexists@example.com');

      // Both should return the same message
      expect(existsResult.message).toBe(notExistsResult.message);
      expect(existsResult.message).toContain('If an account exists');

      consoleSpy.mockRestore();
    });

    it('should invalidate token after password reset', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      let tokenWasCleared = false;

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: 'user-123',
                    reset_token: 'valid-token',
                    reset_token_expiry: futureDate,
                  },
                  error: null,
                }),
              }),
            }),
            update: (data: any) => {
              if (data.reset_token === null) {
                tokenWasCleared = true;
              }
              return {
                eq: () => Promise.resolve({ error: null }),
              };
            },
          };
        }
        return {};
      });

      await resetPassword('valid-token', 'NewPassword123!');

      expect(tokenWasCleared).toBe(true);
    });

    it('should hash passwords with secure salt rounds', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: 'user-123',
                    reset_token: 'valid-token',
                    reset_token_expiry: futureDate,
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

      await resetPassword('valid-token', 'SecurePassword123!');

      expect(mockHash).toHaveBeenCalledWith('SecurePassword123!', 12);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle database connection failure during request', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockImplementation(() => {
        throw new Error('Database connection refused');
      });

      const result = await requestPasswordReset('user@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('An error occurred');

      consoleErrorSpy.mockRestore();
    });

    it('should handle database connection failure during reset', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const futureDate = new Date(Date.now() + 3600000).toISOString();

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: 'user-123',
                    reset_token: 'valid-token',
                    reset_token_expiry: futureDate,
                  },
                  error: null,
                }),
              }),
            }),
            update: () => {
              throw new Error('Database write failed');
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

    it('should handle database failure during admin reset', async () => {
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
              eq: () => Promise.resolve({ error: { message: 'Constraint violation' } }),
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
  });

  describe('Token Generation', () => {
    it('should generate unique tokens for different requests', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockUser = { id: 'user-123', email: 'user@company.com' };
      const tokens: string[] = [];

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
            update: (data: any) => {
              if (data.reset_token) {
                tokens.push(data.reset_token);
              }
              return {
                eq: () => Promise.resolve({ error: null }),
              };
            },
          };
        }
        return {};
      });

      await requestPasswordReset('user@company.com');
      await requestPasswordReset('user@company.com');
      await requestPasswordReset('user@company.com');

      expect(tokens.length).toBe(3);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(3);

      consoleSpy.mockRestore();
    });
  });

  describe('Audit Trail', () => {
    it('should create proper audit log for admin password reset', async () => {
      let capturedAuditLog: any = null;

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { role: 'admin' }, error: null }),
              }),
            }),
            update: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: (data: any) => {
              capturedAuditLog = data;
              return Promise.resolve({ error: null });
            },
          };
        }
        return {};
      });

      await adminResetUserPassword('target-user-789', 'TempPassword123!', 'admin-001');

      expect(capturedAuditLog).toEqual({
        user_id: 'admin-001',
        action: 'admin_password_reset',
        resource_type: 'user',
        resource_id: 'target-user-789',
        details: { target_user_id: 'target-user-789' },
      });
    });
  });

  describe('Multiple User Scenarios', () => {
    it('should handle password reset for different users independently', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const users = [
        { id: 'user-1', email: 'user1@company.com' },
        { id: 'user-2', email: 'user2@company.com' },
        { id: 'user-3', email: 'user3@company.com' },
      ];

      const tokensPerUser: Record<string, string> = {};

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: (field: string, value: string) => ({
                single: () => {
                  const user = users.find(u => u.email === value);
                  return Promise.resolve({ data: user || null, error: user ? null : { message: 'Not found' } });
                },
              }),
            }),
            update: (data: any) => ({
              eq: (field: string, value: string) => {
                if (data.reset_token) {
                  tokensPerUser[value] = data.reset_token;
                }
                return Promise.resolve({ error: null });
              },
            }),
          };
        }
        return {};
      });

      for (const user of users) {
        await requestPasswordReset(user.email);
      }

      expect(Object.keys(tokensPerUser).length).toBe(3);
      
      // Verify each user got a unique token
      const tokenValues = Object.values(tokensPerUser);
      const uniqueTokens = new Set(tokenValues);
      expect(uniqueTokens.size).toBe(3);

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle token verification with past expiry time', async () => {
      const pastExpiry = new Date(Date.now() - 1000).toISOString(); // 1 second ago

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'user-123',
                reset_token: 'edge-token',
                reset_token_expiry: pastExpiry,
              },
              error: null,
            }),
          }),
        }),
      });

      // Token with past expiry time should be invalid
      const result = await verifyResetToken('edge-token');
      expect(result.valid).toBe(false);
    });

    it('should reject empty password in reset due to validation', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();

      mocks.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: 'user-123',
                    reset_token: 'valid-token',
                    reset_token_expiry: futureDate,
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

      // Empty password should be rejected by password validation
      const result = await resetPassword('valid-token', '');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Password');
      // bcrypt.hash should NOT be called because validation fails first
      expect(mockHash).not.toHaveBeenCalled();
    });
  });
});
