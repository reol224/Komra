import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Resend
const mockSendEmail = vi.fn();
vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = {
        send: mockSendEmail,
      };
    },
  };
});

// Mock Supabase
const mockInsert = vi.fn();
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      from: () => ({
        insert: mockInsert,
      }),
    }),
  };
});

// Set up environment variables
const originalEnv = process.env;

describe('EmailService Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 'test-api-key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_KEY: 'test-service-key',
    };
    mockInsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Complete Onboarding Email Flow', () => {
    it('should complete full onboarding email workflow for new customer', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockSendEmail.mockResolvedValue({ data: { id: 'onboarding-email-001' }, error: null });

      const { EmailService } = await import('@/lib/emailService');

      // Simulate new customer onboarding
      const newCustomer = {
        customerEmail: 'newcustomer@enterprise.com',
        username: 'admin@enterprise',
        tempPassword: 'SecureTemp2024!',
        licenseKey: 'ENT-LICENSE-2024-001',
        loginUrl: 'https://enterprise.komrasec.com/login',
      };

      await EmailService.sendWelcomeEmail(newCustomer);

      // Verify email was sent
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      
      // Verify email content includes all critical information
      const sentEmail = mockSendEmail.mock.calls[0][0];
      expect(sentEmail.to).toBe('newcustomer@enterprise.com');
      expect(sentEmail.html).toContain('admin@enterprise');
      expect(sentEmail.html).toContain('SecureTemp2024!');
      expect(sentEmail.html).toContain('ENT-LICENSE-2024-001');
      expect(sentEmail.html).toContain('https://enterprise.komrasec.com/login');

      // Verify audit log was created
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        recipient: 'newcustomer@enterprise.com',
        status: 'sent',
        provider_message_id: 'onboarding-email-001',
      }));

      consoleSpy.mockRestore();
    });

    it('should handle multiple customer onboarding in sequence', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const customers = [
        {
          customerEmail: 'customer1@company.com',
          username: 'admin1',
          tempPassword: 'Pass1234!',
          licenseKey: 'LIC-001',
          loginUrl: 'https://app.komrasec.com/login',
        },
        {
          customerEmail: 'customer2@company.com',
          username: 'admin2',
          tempPassword: 'Pass5678!',
          licenseKey: 'LIC-002',
          loginUrl: 'https://app.komrasec.com/login',
        },
        {
          customerEmail: 'customer3@company.com',
          username: 'admin3',
          tempPassword: 'Pass9012!',
          licenseKey: 'LIC-003',
          loginUrl: 'https://app.komrasec.com/login',
        },
      ];

      let emailCount = 0;
      mockSendEmail.mockImplementation(() => {
        emailCount++;
        return Promise.resolve({ data: { id: `email-${emailCount}` }, error: null });
      });

      const { EmailService } = await import('@/lib/emailService');

      for (const customer of customers) {
        await EmailService.sendWelcomeEmail(customer);
      }

      expect(mockSendEmail).toHaveBeenCalledTimes(3);
      expect(mockInsert).toHaveBeenCalledTimes(3);

      consoleSpy.mockRestore();
    });
  });

  describe('Password Reset Email Flow', () => {
    it('should complete full password reset flow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockSendEmail.mockResolvedValue({ data: { id: 'reset-001' }, error: null });

      const { EmailService } = await import('@/lib/emailService');

      await EmailService.sendPasswordResetEmail(
        'user@company.com',
        'secure-reset-token-abc123def456',
        'https://app.komrasec.com/reset-password'
      );

      const sentEmail = mockSendEmail.mock.calls[0][0];
      
      // Verify password reset email structure
      expect(sentEmail.to).toBe('user@company.com');
      expect(sentEmail.subject).toBe('Reset Your Komra Security Password');
      expect(sentEmail.from).toContain('security@komrasec.com');
      
      // Verify reset link is properly constructed
      expect(sentEmail.html).toContain('https://app.komrasec.com/reset-password?token=secure-reset-token-abc123def456');
      expect(sentEmail.text).toContain('https://app.komrasec.com/reset-password?token=secure-reset-token-abc123def456');

      // Verify audit log
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        recipient: 'user@company.com',
        subject: 'Reset Your Komra Security Password',
        status: 'sent',
      }));

      consoleSpy.mockRestore();
    });

    it('should handle password reset for multiple users', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const resetRequests = [
        { email: 'user1@company.com', token: 'token-1', url: 'https://app.komrasec.com/reset' },
        { email: 'user2@company.com', token: 'token-2', url: 'https://app.komrasec.com/reset' },
      ];

      let emailCount = 0;
      mockSendEmail.mockImplementation(() => {
        emailCount++;
        return Promise.resolve({ data: { id: `reset-${emailCount}` }, error: null });
      });

      const { EmailService } = await import('@/lib/emailService');

      for (const request of resetRequests) {
        await EmailService.sendPasswordResetEmail(request.email, request.token, request.url);
      }

      expect(mockSendEmail).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle transient email delivery failure and log appropriately', async () => {
      mockSendEmail.mockResolvedValue({
        data: null,
        error: { message: 'Temporary service unavailable' },
      });

      const { EmailService } = await import('@/lib/emailService');

      await expect(
        EmailService.sendWelcomeEmail({
          customerEmail: 'test@example.com',
          username: 'testuser',
          tempPassword: 'TempPass123!',
          licenseKey: 'LICENSE-KEY-123',
          loginUrl: 'https://app.komrasec.com/login',
        })
      ).rejects.toThrow('Resend API error: Temporary service unavailable');

      // Verify failure is logged for audit/retry purposes
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failed',
        error_message: 'Resend API error: Temporary service unavailable',
      }));
    });

    it('should handle rate limiting gracefully', async () => {
      mockSendEmail.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded. Please retry after 60 seconds.' },
      });

      const { EmailService } = await import('@/lib/emailService');

      await expect(
        EmailService.sendPasswordResetEmail(
          'user@example.com',
          'token',
          'https://app.komrasec.com/reset'
        )
      ).rejects.toThrow('Resend API error: Rate limit exceeded');

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failed',
        error_message: expect.stringContaining('Rate limit'),
      }));
    });

    it('should handle network failures', async () => {
      mockSendEmail.mockRejectedValue(new Error('ECONNREFUSED: Connection refused'));

      const { EmailService } = await import('@/lib/emailService');

      await expect(
        EmailService.sendWelcomeEmail({
          customerEmail: 'test@example.com',
          username: 'testuser',
          tempPassword: 'TempPass123!',
          licenseKey: 'LICENSE-KEY-123',
          loginUrl: 'https://app.komrasec.com/login',
        })
      ).rejects.toThrow('ECONNREFUSED');

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failed',
      }));
    });
  });

  describe('Email Content Security', () => {
    it('should include security warnings in welcome email', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockSendEmail.mockResolvedValue({ data: { id: 'security-test-001' }, error: null });

      const { EmailService } = await import('@/lib/emailService');

      await EmailService.sendWelcomeEmail({
        customerEmail: 'secure@company.com',
        username: 'secureuser',
        tempPassword: 'TempPass123!',
        licenseKey: 'LICENSE-KEY-123',
        loginUrl: 'https://app.komrasec.com/login',
      });

      const htmlContent = mockSendEmail.mock.calls[0][0].html;

      // Verify security warnings are present
      expect(htmlContent).toContain('Security Notice');
      expect(htmlContent).toContain('temporary password');
      expect(htmlContent).toContain('MFA');

      consoleSpy.mockRestore();
    });

    it('should include expiration notice in password reset email', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockSendEmail.mockResolvedValue({ data: { id: 'expiry-test-001' }, error: null });

      const { EmailService } = await import('@/lib/emailService');

      await EmailService.sendPasswordResetEmail(
        'user@example.com',
        'token',
        'https://app.komrasec.com/reset'
      );

      const htmlContent = mockSendEmail.mock.calls[0][0].html;
      const textContent = mockSendEmail.mock.calls[0][0].text;

      // Verify expiration notice
      expect(htmlContent).toContain('1 hour');
      expect(textContent).toContain('1 hour');

      consoleSpy.mockRestore();
    });
  });

  describe('Audit Trail', () => {
    it('should create complete audit trail for successful email', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockSendEmail.mockResolvedValue({ data: { id: 'audit-email-001' }, error: null });

      const { EmailService } = await import('@/lib/emailService');

      await EmailService.sendWelcomeEmail({
        customerEmail: 'audit@company.com',
        username: 'audituser',
        tempPassword: 'TempPass123!',
        licenseKey: 'LICENSE-KEY-123',
        loginUrl: 'https://app.komrasec.com/login',
      });

      expect(mockInsert).toHaveBeenCalledWith({
        recipient: 'audit@company.com',
        subject: 'Welcome to Komra Security - Your Admin Credentials',
        status: 'sent',
        provider: 'resend',
        provider_message_id: 'audit-email-001',
        sent_at: expect.any(String),
      });

      consoleSpy.mockRestore();
    });

    it('should create audit trail for failed email with error details', async () => {
      mockSendEmail.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email address format' },
      });

      const { EmailService } = await import('@/lib/emailService');

      try {
        await EmailService.sendWelcomeEmail({
          customerEmail: 'invalid-email',
          username: 'testuser',
          tempPassword: 'TempPass123!',
          licenseKey: 'LICENSE-KEY-123',
          loginUrl: 'https://app.komrasec.com/login',
        });
      } catch {
        // Expected to throw
      }

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        recipient: 'invalid-email',
        status: 'failed',
        error_message: 'Resend API error: Invalid email address format',
        sent_at: expect.any(String),
      }));
    });
  });

  describe('Email Template Variations', () => {
    it('should handle different login URLs correctly', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const loginUrls = [
        'https://app.komrasec.com/login',
        'https://enterprise.komrasec.com/login',
        'https://staging.komrasec.com/login',
        '', // Empty - should use default
      ];

      mockSendEmail.mockResolvedValue({ data: { id: 'url-test' }, error: null });

      const { EmailService } = await import('@/lib/emailService');

      for (const loginUrl of loginUrls) {
        mockSendEmail.mockClear();
        
        await EmailService.sendWelcomeEmail({
          customerEmail: 'test@example.com',
          username: 'testuser',
          tempPassword: 'TempPass123!',
          licenseKey: 'LICENSE-KEY-123',
          loginUrl,
        });

        const htmlContent = mockSendEmail.mock.calls[0][0].html;
        
        if (loginUrl) {
          expect(htmlContent).toContain(loginUrl);
        } else {
          expect(htmlContent).toContain('https://komrasec.com/login');
        }
      }

      consoleSpy.mockRestore();
    });

    it('should handle special characters in credentials', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockSendEmail.mockResolvedValue({ data: { id: 'special-char-test' }, error: null });

      const { EmailService } = await import('@/lib/emailService');

      await EmailService.sendWelcomeEmail({
        customerEmail: 'test@example.com',
        username: 'user+special@domain.com',
        tempPassword: 'P@$$w0rd!#%&*',
        licenseKey: 'LIC-123-ABC-XYZ',
        loginUrl: 'https://app.komrasec.com/login',
      });

      const htmlContent = mockSendEmail.mock.calls[0][0].html;
      
      expect(htmlContent).toContain('user+special@domain.com');
      expect(htmlContent).toContain('P@$$w0rd!#%&*');
      expect(htmlContent).toContain('LIC-123-ABC-XYZ');

      consoleSpy.mockRestore();
    });
  });

  describe('Environment Configuration', () => {
    it('should fail gracefully when API key is missing', async () => {
      delete process.env.RESEND_API_KEY;

      vi.resetModules();
      const { EmailService } = await import('@/lib/emailService');

      await expect(
        EmailService.sendWelcomeEmail({
          customerEmail: 'test@example.com',
          username: 'testuser',
          tempPassword: 'TempPass123!',
          licenseKey: 'LICENSE-KEY-123',
          loginUrl: 'https://app.komrasec.com/login',
        })
      ).rejects.toThrow('RESEND_API_KEY is not configured');
    });
  });

  describe('Concurrent Email Sending', () => {
    it('should handle concurrent email sends', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      let callCount = 0;
      mockSendEmail.mockImplementation(() => {
        callCount++;
        return Promise.resolve({ data: { id: `concurrent-${callCount}` }, error: null });
      });

      const { EmailService } = await import('@/lib/emailService');

      const emailPromises = Array.from({ length: 5 }, (_, i) =>
        EmailService.sendWelcomeEmail({
          customerEmail: `user${i}@example.com`,
          username: `user${i}`,
          tempPassword: `TempPass${i}!`,
          licenseKey: `LIC-${i}`,
          loginUrl: 'https://app.komrasec.com/login',
        })
      );

      await Promise.all(emailPromises);

      expect(mockSendEmail).toHaveBeenCalledTimes(5);
      expect(mockInsert).toHaveBeenCalledTimes(5);

      consoleSpy.mockRestore();
    });

    it('should handle mixed success and failure in concurrent sends', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      let callCount = 0;
      mockSendEmail.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          return Promise.resolve({ data: null, error: { message: 'Simulated failure' } });
        }
        return Promise.resolve({ data: { id: `success-${callCount}` }, error: null });
      });

      const { EmailService } = await import('@/lib/emailService');

      const emailPromises = Array.from({ length: 4 }, (_, i) =>
        EmailService.sendWelcomeEmail({
          customerEmail: `user${i}@example.com`,
          username: `user${i}`,
          tempPassword: `TempPass${i}!`,
          licenseKey: `LIC-${i}`,
          loginUrl: 'https://app.komrasec.com/login',
        }).catch(() => 'failed')
      );

      const results = await Promise.all(emailPromises);

      // 2 should succeed, 2 should fail
      expect(results.filter(r => r === 'failed')).toHaveLength(2);
      expect(results.filter(r => r === undefined)).toHaveLength(2);

      consoleSpy.mockRestore();
    });
  });
});
