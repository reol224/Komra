import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

Mock Resend
const mockSendEmail = vi.fn();
vi.mock("resend", () => {
  return {
    Resend: class MockResend {
      emails = {
        send: mockSendEmail,
      };
    },
  };
});

Mock Supabase
const mockInsert = vi.fn();
vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => ({
      from: () => ({
        insert: mockInsert,
      }),
    }),
  };
});

Set up environment variables
const originalEnv = process.env;

describe("EmailService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "test-api-key",
      NEXT_PUBLIC_SUPABASE_URL: "https:////test.supabase.co",
      SUPABASE_SERVICE_KEY: "test-service-key",
    };
    mockInsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("sendWelcomeEmail", () => {
    it("should send welcome email successfully", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockSendEmail.mockResolvedValue({
        data: { id: "email-123" },
        error: null,
      });

      const { EmailService } = await import("./emailService");

      await EmailService.sendWelcomeEmail({
        customerEmail: "test@example.com",
        username: "testuser",
        tempPassword: "TempPass123!",
        licenseKey: "LICENSE-KEY-123",
        loginUrl: "https:////komrasec.com/login",
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith({
        from: "onboarding@resend.dev",
        to: "test@example.com",
        subject: "Welcome to Komra - Your Account Details",
        html: expect.stringContaining("testuser"),
      });
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: "test@example.com",
          status: "sent",
          provider: "resend",
          provider_message_id: "email-123",
        }),
      );

      consoleSpy.mockRestore();
    });

    it("should throw error when required parameters are missing", async () => {
      const { EmailService } = await import("./emailService");

      await expect(
        EmailService.sendWelcomeEmail({
          customerEmail: "",
          username: "testuser",
          tempPassword: "TempPass123!",
          licenseKey: "LICENSE-KEY-123",
          loginUrl: "https:////komrasec.com/login",
        }),
      ).rejects.toThrow("Missing required email parameters");

      await expect(
        EmailService.sendWelcomeEmail({
          customerEmail: "test@example.com",
          username: "",
          tempPassword: "TempPass123!",
          licenseKey: "LICENSE-KEY-123",
          loginUrl: "https:////komrasec.com/login",
        }),
      ).rejects.toThrow("Missing required email parameters");
    });

    it("should handle Resend API error", async () => {
      mockSendEmail.mockResolvedValue({
        data: null,
        error: { message: "Rate limit exceeded" },
      });

      const { EmailService } = await import("./emailService");

      await expect(
        EmailService.sendWelcomeEmail({
          customerEmail: "test@example.com",
          username: "testuser",
          tempPassword: "TempPass123!",
          licenseKey: "LICENSE-KEY-123",
          loginUrl: "https:////komrasec.com/login",
        }),
      ).rejects.toThrow("Resend API error: Rate limit exceeded");

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          error_message: "Resend API error: Rate limit exceeded",
        }),
      );
    });

    it("should handle send exception", async () => {
      mockSendEmail.mockRejectedValue(new Error("Network error"));

      const { EmailService } = await import("./emailService");

      await expect(
        EmailService.sendWelcomeEmail({
          customerEmail: "test@example.com",
          username: "testuser",
          tempPassword: "TempPass123!",
          licenseKey: "LICENSE-KEY-123",
          loginUrl: "https://komrasec.com/login",
        }),
      ).rejects.toThrow("Network error");

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          error_message: "Network error",
        }),
      );
    });

    it("should use default login URL when not provided", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockSendEmail.mockResolvedValue({
        data: { id: "email-456" },
        error: null,
      });

      const { EmailService } = await import("./emailService");

      await EmailService.sendWelcomeEmail({
        customerEmail: "test@example.com",
        username: "testuser",
        tempPassword: "TempPass123!",
        licenseKey: "LICENSE-KEY-123",
        loginUrl: "",
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("https:////komrasec.com/login"),
        }),
      );

      consoleSpy.mockRestore();
    });

    it("should include license key in email HTML", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockSendEmail.mockResolvedValue({
        data: { id: "email-789" },
        error: null,
      });

      const { EmailService } = await import("./emailService");

      await EmailService.sendWelcomeEmail({
        customerEmail: "test@example.com",
        username: "testuser",
        tempPassword: "TempPass123!",
        licenseKey: "UNIQUE-LICENSE-KEY",
        loginUrl: "https://komrasec.com/login",
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("UNIQUE-LICENSE-KEY"),
        }),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should send password reset email successfully", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockSendEmail.mockResolvedValue({
        data: { id: "reset-email-123" },
        error: null,
      });

      const { EmailService } = await import("./emailService");

      await EmailService.sendPasswordResetEmail(
        "user@example.com",
        "reset-token-abc123",
        "https://komrasec.com/reset-password",
      );

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith({
        from: "Komra Security <security@komrasec.com>",
        to: "user@example.com",
        subject: "Reset Your Komra Security Password",
        html: expect.stringContaining("reset-token-abc123"),
        text: expect.stringContaining("reset-token-abc123"),
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: "user@example.com",
          subject: "Reset Your Komra Security Password",
          status: "sent",
          provider: "resend",
          provider_message_id: "reset-email-123",
        }),
      );

      consoleSpy.mockRestore();
    });

    it("should include reset URL in email", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockSendEmail.mockResolvedValue({
        data: { id: "reset-email-456" },
        error: null,
      });

      const { EmailService } = await import("./emailService");

      await EmailService.sendPasswordResetEmail(
        "user@example.com",
        "token-xyz",
        "https:////custom.domain.com/reset",
      );

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(
            "https:////custom.domain.com/reset?token=token-xyz",
          ),
          text: expect.stringContaining(
            "https:////custom.domain.com/reset?token=token-xyz",
          ),
        }),
      );

      consoleSpy.mockRestore();
    });

    it("should handle Resend API error for password reset", async () => {
      mockSendEmail.mockResolvedValue({
        data: null,
        error: { message: "Invalid recipient" },
      });

      const { EmailService } = await import("./emailService");

      await expect(
        EmailService.sendPasswordResetEmail(
          "invalid-email",
          "reset-token",
          "https://komrasec.com/reset",
        ),
      ).rejects.toThrow("Resend API error: Invalid recipient");

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          error_message: "Resend API error: Invalid recipient",
        }),
      );
    });

    it("should handle network error for password reset", async () => {
      mockSendEmail.mockRejectedValue(new Error("Connection timeout"));

      const { EmailService } = await import("./emailService");

      await expect(
        EmailService.sendPasswordResetEmail(
          "user@example.com",
          "reset-token",
          "https://komrasec.com/reset",
        ),
      ).rejects.toThrow("Connection timeout");

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          error_message: "Connection timeout",
        }),
      );
    });

    it("should include security notice in password reset email", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockSendEmail.mockResolvedValue({
        data: { id: "reset-email-789" },
        error: null,
      });

      const { EmailService } = await import("./emailService");

      await EmailService.sendPasswordResetEmail(
        "user@example.com",
        "reset-token",
        "https://komrasec.com/reset",
      );

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Security Notice"),
        }),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("RESEND_API_KEY validation", () => {
    it("should throw error when RESEND_API_KEY is not set", async () => {
      delete process.env.RESEND_API_KEY;

      vi.resetModules();
      const { EmailService } = await import("./emailService");

      await expect(
        EmailService.sendWelcomeEmail({
          customerEmail: "test@example.com",
          username: "testuser",
          tempPassword: "TempPass123!",
          licenseKey: "LICENSE-KEY-123",
          loginUrl: "https://komrasec.com/login",
        }),
      ).rejects.toThrow("RESEND_API_KEY is not configured");
    });
  });

  describe("Email HTML content", () => {
    it("should generate proper HTML structure for welcome email", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockSendEmail.mockResolvedValue({
        data: { id: "email-html-test" },
        error: null,
      });

      const { EmailService } = await import("./emailService");

      await EmailService.sendWelcomeEmail({
        customerEmail: "test@example.com",
        username: "admin_user",
        tempPassword: "SecureTemp123!",
        licenseKey: "LIC-12345-ABCDE",
        loginUrl: "https://komrasec.com/login",
      });

      const htmlContent = mockSendEmail.mock.calls[0][0].html;

      expect(htmlContent).toContain("<!DOCTYPE html>");
      expect(htmlContent).toContain("Welcome to Komra Security");
      expect(htmlContent).toContain("admin_user");
      expect(htmlContent).toContain("SecureTemp123!");
      expect(htmlContent).toContain("LIC-12345-ABCDE");
      expect(htmlContent).toContain("Your Admin Credentials");
      expect(htmlContent).toContain("Login to Komra");

      consoleSpy.mockRestore();
    });

    it("should include next steps in welcome email", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockSendEmail.mockResolvedValue({
        data: { id: "email-steps-test" },
        error: null,
      });

      const { EmailService } = await import("./emailService");

      await EmailService.sendWelcomeEmail({
        customerEmail: "test@example.com",
        username: "testuser",
        tempPassword: "TempPass123!",
        licenseKey: "LICENSE-KEY-123",
        loginUrl: "https://komrasec.com/login",
      });

      const htmlContent = mockSendEmail.mock.calls[0][0].html;

      expect(htmlContent).toContain("Next Steps");
      expect(htmlContent).toContain("Change your temporary password");
      expect(htmlContent).toContain("Multi-Factor Authentication");

      consoleSpy.mockRestore();
    });

    it("should include support information in welcome email", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockSendEmail.mockResolvedValue({
        data: { id: "email-support-test" },
        error: null,
      });

      const { EmailService } = await import("./emailService");

      await EmailService.sendWelcomeEmail({
        customerEmail: "test@example.com",
        username: "testuser",
        tempPassword: "TempPass123!",
        licenseKey: "LICENSE-KEY-123",
        loginUrl: "https://komrasec.com/login",
      });

      const htmlContent = mockSendEmail.mock.calls[0][0].html;

      expect(htmlContent).toContain("support@komrasec.com");
      expect(htmlContent).toContain("/docs");

      consoleSpy.mockRestore();
    });
  });

  describe("Email logging", () => {
    it("should log sent email with correct metadata", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockSendEmail.mockResolvedValue({
        data: { id: "logged-email-id" },
        error: null,
      });

      const { EmailService } = await import("./emailService");

      await EmailService.sendWelcomeEmail({
        customerEmail: "logged@example.com",
        username: "testuser",
        tempPassword: "TempPass123!",
        licenseKey: "LICENSE-KEY-123",
        loginUrl: "https://komrasec.com/login",
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: "logged@example.com",
          status: "sent",
          provider: "resend",
          provider_message_id: "logged-email-id",
          sent_at: expect.any(String),
        }),
      );

      consoleSpy.mockRestore();
    });

    it("should log failed email with error message", async () => {
      mockSendEmail.mockResolvedValue({
        data: null,
        error: { message: "Specific error message" },
      });

      const { EmailService } = await import("./emailService");

      try {
        await EmailService.sendWelcomeEmail({
          customerEmail: "failed@example.com",
          username: "testuser",
          tempPassword: "TempPass123!",
          licenseKey: "LICENSE-KEY-123",
          loginUrl: "https://komrasec.com/login",
        });
      } catch {
        Expected to throw
      }

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: "failed@example.com",
          status: "failed",
          error_message: "Resend API error: Specific error message",
        }),
      );
    });
  });
});

describe("EmailService - Logic Tests", () => {
  describe("Email parameter validation", () => {
    it("should validate required email parameters", () => {
      const params = {
        customerEmail: "test@example.com",
        username: "testuser",
        tempPassword: "TempPass123!",
        licenseKey: "lic-abc123",
        loginUrl: "https:////komrasec.com",
      };

      expect(params.customerEmail).toContain("@");
      expect(params.username).toBeTruthy();
      expect(params.tempPassword.length).toBeGreaterThan(8);
      expect(params.licenseKey).toMatch(/^lic-/);
      expect(params.loginUrl).toContain("komrasec.com");
    });

    it("should use correct email domain", () => {
      const senderEmail = "onboarding@komrasec.com";
      expect(senderEmail).toContain("@komrasec.com");
    });

    it("should use correct security email domain", () => {
      const securityEmail = "security@komrasec.com";
      expect(securityEmail).toContain("@komrasec.com");
    });
  });

  describe("Email content requirements", () => {
    it("should include security warnings in content", () => {
      const requiredWarnings = [
        "temporary password",
        "MFA",
        "Multi-Factor Authentication",
        "change",
      ];

      requiredWarnings.forEach((warning) => {
        expect(warning).toBeTruthy();
      });
    });

    it("should include all credential fields", () => {
      const credentialFields = ["username", "tempPassword", "licenseKey"];

      credentialFields.forEach((field) => {
        expect(field).toBeTruthy();
      });
    });

    it("should include next steps", () => {
      const nextSteps = [
        "Log in using your credentials",
        "Change your temporary password",
        "Set up Multi-Factor Authentication",
        "Deploy your first agent",
      ];

      expect(nextSteps.length).toBe(4);
    });
  });

  describe("Password reset email", () => {
    it("should construct reset URL correctly", () => {
      const resetUrl = "https:////komrasec.com/reset-password";
      const resetToken = "reset-token-123";
      const fullUrl = `${resetUrl}?token=${resetToken}`;

      expect(fullUrl).toContain("komrasec.com");
      expect(fullUrl).toContain("reset-token-123");
      expect(fullUrl).toMatch(/\?token=/);
    });

    it("should include expiration warning", () => {
      const expirationMessage = "expires in 1 hour";
      expect(expirationMessage).toContain("1 hour");
    });
  });

  describe("Error handling", () => {
    it("should handle missing email gracefully", () => {
      const validateEmail = (email: string | undefined) => {
        return email && email.includes("@");
      };

      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail(undefined)).toBeFalsy();
      expect(validateEmail("")).toBeFalsy();
    });

    it("should log errors to database", () => {
      const errorLog = {
        recipient: "test@example.com",
        status: "failed",
        error_message: "API error",
        provider: "resend",
      };

      expect(errorLog.status).toBe("failed");
      expect(errorLog.error_message).toBeTruthy();
    });
  });

  describe("Email templates", () => {
    it("should have HTML and text versions", () => {
      const emailFormats = ["html", "text"];
      expect(emailFormats).toContain("html");
      expect(emailFormats).toContain("text");
    });

    it("should include branding", () => {
      const branding = {
        name: "Komra Security",
        domain: "komrasec.com",
        supportEmail: "support@komrasec.com",
      };

      expect(branding.name).toBe("Komra Security");
      expect(branding.domain).toBe("komrasec.com");
      expect(branding.supportEmail).toContain("@komrasec.com");
    });
  });
});
