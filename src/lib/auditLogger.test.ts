import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock storage for localStorage
let mockStorage: Record<string, string> = {};

// Type definition for mock functions
interface MockFns {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  getUser: ReturnType<typeof vi.fn>;
}

// Mock Supabase - the factory runs at module load time
vi.mock("@supabase/supabase-js", () => {
  const insert = vi.fn();
  const select = vi.fn();
  const eq = vi.fn();
  const gte = vi.fn();
  const lte = vi.fn();
  const limit = vi.fn();
  const order = vi.fn();
  const getUser = vi.fn();

  // Store refs for test access
  (global as any).__supabaseMocks = {
    insert,
    select,
    eq,
    gte,
    lte,
    limit,
    order,
    getUser,
  };

  return {
    createClient: () => ({
      from: () => ({
        insert,
        select: () => ({
          order,
          eq,
          gte,
          lte,
          limit,
        }),
      }),
      auth: {
        getUser,
      },
    }),
  };
});

// Import after mocking
import { AuditLogger, auditLogger, AuditLogEntry } from "./auditLogger";

// Helper to get mocks
const getMocks = () => (global as any).__supabaseMocks as MockFns;

describe("AuditLogger", () => {
  let mocks: ReturnType<typeof getMocks>;

  beforeEach(() => {
    mocks = getMocks();
    vi.clearAllMocks();
    mockStorage = {};

    // Setup default mock behaviors - chainable
    mocks.select.mockReturnThis();
    mocks.eq.mockReturnThis();
    mocks.gte.mockReturnThis();
    mocks.lte.mockReturnThis();
    mocks.limit.mockReturnThis();
    mocks.order.mockReturnThis();

    // Default successful insert
    mocks.insert.mockResolvedValue({ error: null });

    // Default user
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "test-user-id",
          email: "test@example.com",
        },
      },
    });

    // Mock localStorage
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => mockStorage[key] || null,
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
      (key: string, value: string) => {
        mockStorage[key] = value;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance on multiple calls", () => {
      const instance1 = AuditLogger.getInstance();
      const instance2 = AuditLogger.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should export a singleton instance as auditLogger", () => {
      expect(auditLogger).toBeDefined();
      expect(auditLogger).toBeInstanceOf(AuditLogger);
    });
  });

  describe("log method", () => {
    it("should log an entry to Supabase", async () => {
      await auditLogger.log("TEST_ACTION", "test_resource", { test: "data" });

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: "TEST_ACTION",
          resource_type: "test_resource",
          details: { test: "data" },
          user_id: "test-user-id",
          user_email: "test@example.com",
          severity: "medium",
          status: "success",
        }),
      ]);
    });

    it("should use default severity and status when not provided", async () => {
      await auditLogger.log("TEST_ACTION", "test_resource", {});

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          severity: "medium",
          status: "success",
        }),
      ]);
    });

    it("should use custom severity when provided", async () => {
      await auditLogger.log(
        "TEST_ACTION",
        "test_resource",
        {},
        { severity: "critical" },
      );

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          severity: "critical",
        }),
      ]);
    });

    it("should use custom status when provided", async () => {
      await auditLogger.log(
        "TEST_ACTION",
        "test_resource",
        {},
        { status: "failure" },
      );

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          status: "failure",
        }),
      ]);
    });

    it("should include resourceId when provided", async () => {
      await auditLogger.log(
        "TEST_ACTION",
        "test_resource",
        {},
        { resourceId: "res-123" },
      );

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          resource_id: "res-123",
        }),
      ]);
    });

    it("should include metadata when provided", async () => {
      const metadata = { custom: "data", flag: true };
      await auditLogger.log("TEST_ACTION", "test_resource", {}, { metadata });

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          metadata,
        }),
      ]);
    });

    it("should include session_id in log entry", async () => {
      await auditLogger.log("TEST_ACTION", "test_resource", {});

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          session_id: expect.stringMatching(/^session_\d+_[a-z0-9]+$/),
        }),
      ]);
    });

    it("should include timestamp in ISO format", async () => {
      await auditLogger.log("TEST_ACTION", "test_resource", {});

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
          ),
        }),
      ]);
    });

    it("should use anonymous user when no user is logged in", async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null } });

      await auditLogger.log("TEST_ACTION", "test_resource", {});

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: "anonymous",
          user_email: "anonymous@system.local",
        }),
      ]);
    });

    it("should handle Supabase insert errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mocks.insert.mockResolvedValue({ error: new Error("Database error") });

      await auditLogger.log("TEST_ACTION", "test_resource", {});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to log audit entry:",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });

    it("should fallback to localStorage when insert fails", async () => {
      mocks.insert.mockResolvedValue({
        error: new Error("Database error, falling back to localStorage"),
      });
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

      await auditLogger.log("TEST_ACTION", "test_resource", {});

      expect(setItemSpy).toHaveBeenCalledWith(
        "audit_logs_fallback",
        expect.any(String),
      );
    });

    it("should handle exceptions gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mocks.getUser.mockRejectedValue(new Error("Auth error"));

      await auditLogger.log("TEST_ACTION", "test_resource", {});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Audit logging failed:",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("logPermissionMatrixUpdate", () => {
    it("should log permission matrix updates with critical severity", async () => {
      const changes = [
        {
          role: "admin",
          permission: "user.delete",
          action: "granted" as const,
        },
        {
          role: "viewer",
          permission: "report.view",
          action: "revoked" as const,
        },
      ];

      await auditLogger.logPermissionMatrixUpdate(changes);

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: "PERMISSION_MATRIX_UPDATED",
          resource_type: "permission_matrix",
          severity: "critical",
          status: "success",
          details: expect.objectContaining({
            total_changes: 2,
            changes,
            affected_roles: ["admin", "viewer"],
            affected_permissions: ["user.delete", "report.view"],
          }),
          metadata: expect.objectContaining({
            action_category: "permission_management",
            compliance_relevant: true,
            security_relevant: true,
          }),
        }),
      ]);
    });

    it("should deduplicate affected roles and permissions", async () => {
      const changes = [
        {
          role: "admin",
          permission: "user.delete",
          action: "granted" as const,
        },
        {
          role: "admin",
          permission: "user.create",
          action: "granted" as const,
        },
      ];

      await auditLogger.logPermissionMatrixUpdate(changes);

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          details: expect.objectContaining({
            affected_roles: ["admin"],
            affected_permissions: ["user.delete", "user.create"],
          }),
        }),
      ]);
    });
  });

  describe("logReportGeneration", () => {
    it("should log report generation with high severity", async () => {
      const reportData = {
        endpointInventory: { totalEndpoints: 50 },
        vulnerabilitySummary: { totalCVEs: 25, bySeverity: { critical: 5 } },
        executiveSummary: { overallRiskRating: "high" },
        metadata: { targetEnvironments: ["production"], reportVersion: "2.0" },
      };

      await auditLogger.logReportGeneration(reportData);

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: "REPORT_GENERATED",
          resource_type: "security_report",
          severity: "high",
          details: expect.objectContaining({
            total_endpoints: 50,
            total_cves: 25,
            critical_cves: 5,
            risk_rating: "high",
            environments: ["production"],
            report_version: "2.0",
          }),
        }),
      ]);
    });

    it("should handle missing report data with defaults", async () => {
      await auditLogger.logReportGeneration({});

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          details: expect.objectContaining({
            total_endpoints: 0,
            total_cves: 0,
            critical_cves: 0,
            risk_rating: "unknown",
            environments: [],
            report_version: "1.0",
          }),
        }),
      ]);
    });
  });

  describe("logReportDownload", () => {
    it("should log report download with medium severity", async () => {
      await auditLogger.logReportDownload("PDF");

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: "REPORT_DOWNLOADED",
          resource_type: "security_report",
          severity: "medium",
          details: expect.objectContaining({
            download_format: "PDF",
          }),
          metadata: expect.objectContaining({
            action_category: "data_export",
            compliance_relevant: true,
          }),
        }),
      ]);
    });
  });

  describe("logReportEmail", () => {
    it("should log report email with masked recipients", async () => {
      const recipients = ["john@example.com", "jane@company.org"];

      await auditLogger.logReportEmail(recipients);

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: "REPORT_EMAILED",
          resource_type: "security_report",
          severity: "high",
          details: expect.objectContaining({
            recipient_count: 2,
            recipients: ["jo***@example.com", "ja***@company.org"],
          }),
        }),
      ]);
    });
  });

  describe("logUserLogin", () => {
    it("should log user login with low severity", async () => {
      await auditLogger.logUserLogin();

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: "USER_LOGIN",
          resource_type: "authentication",
          severity: "low",
          status: "success",
          details: expect.objectContaining({
            login_method: "standard",
          }),
          metadata: expect.objectContaining({
            action_category: "authentication",
            security_relevant: true,
          }),
        }),
      ]);
    });
  });

  describe("logUserLogout", () => {
    it("should log user logout with session duration", async () => {
      await auditLogger.logUserLogout();

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: "USER_LOGOUT",
          resource_type: "authentication",
          severity: "low",
          details: expect.objectContaining({
            session_duration: expect.any(Number),
          }),
        }),
      ]);
    });
  });

  describe("logDataAccess", () => {
    it("should log data access with uppercased action", async () => {
      await auditLogger.logDataAccess("vulnerability", "vuln-123", "read");

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: "DATA_READ",
          resource_type: "vulnerability",
          resource_id: "vuln-123",
          details: expect.objectContaining({
            resource_accessed: "vuln-123",
            access_type: "read",
          }),
        }),
      ]);
    });

    it("should handle different access actions", async () => {
      await auditLogger.logDataAccess("endpoint", "ep-456", "update");

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: "DATA_UPDATE",
        }),
      ]);
    });
  });

  describe("logSecurityEvent", () => {
    it("should log security event with critical severity", async () => {
      const details = { threat_level: "high", source_ip: "192.168.1.100" };

      await auditLogger.logSecurityEvent("intrusion_detected", details);

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: "SECURITY_INTRUSION_DETECTED",
          resource_type: "security_event",
          severity: "critical",
          details: expect.objectContaining({
            event_type: "intrusion_detected",
            threat_level: "high",
            source_ip: "192.168.1.100",
          }),
          metadata: expect.objectContaining({
            action_category: "security",
            security_relevant: true,
            requires_investigation: true,
          }),
        }),
      ]);
    });

    it("should use status from details if provided", async () => {
      await auditLogger.logSecurityEvent("scan_complete", {
        status: "success",
      });

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          status: "success",
        }),
      ]);
    });
  });

  describe("logSystemChange", () => {
    it("should log system change with high severity", async () => {
      const details = {
        setting: "mfa_required",
        old_value: false,
        new_value: true,
      };

      await auditLogger.logSystemChange("configuration", details);

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: "SYSTEM_CONFIGURATION",
          resource_type: "system_configuration",
          severity: "high",
          details: expect.objectContaining({
            change_type: "configuration",
            setting: "mfa_required",
            old_value: false,
            new_value: true,
          }),
        }),
      ]);
    });
  });

  describe("getAuditLogs", () => {
    beforeEach(() => {
      // Setup chainable mock to return data at the end
      mocks.order.mockResolvedValue({
        data: [
          {
            id: "1",
            action: "TEST_ACTION",
            user_id: "user-1",
            timestamp: "2024-01-01T00:00:00Z",
          },
        ],
        error: null,
      });
    });

    it("should retrieve audit logs without filters", async () => {
      const logs = await auditLogger.getAuditLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe("TEST_ACTION");
    });

    it("should return empty array on error", async () => {
      mocks.order.mockResolvedValue({
        data: null,
        error: new Error("Query failed"),
      });
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const logs = await auditLogger.getAuditLogs();

      expect(logs).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to retrieve audit logs:",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });

    it("should handle exceptions and return empty array", async () => {
      mocks.order.mockRejectedValue(new Error("Connection failed"));
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const logs = await auditLogger.getAuditLogs();

      expect(logs).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error querying audit logs:",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("getAuditSummary", () => {
    const sampleMockLogs = [
      {
        user_id: "user-1",
        action: "USER_LOGIN",
        metadata: { security_relevant: true },
      },
      {
        user_id: "user-1",
        action: "USER_LOGIN",
        metadata: { security_relevant: true },
      },
      {
        user_id: "user-2",
        action: "REPORT_GENERATED",
        metadata: { compliance_relevant: true },
      },
      {
        user_id: "user-3",
        action: "SECURITY_EVENT",
        metadata: { compliance_relevant: true, security_relevant: true },
      },
      {
        user_id: "user-3",
        action: "DATA_ACCESS",
        metadata: { compliance_relevant: true },
      },
    ];

    beforeEach(() => {
      mocks.gte.mockResolvedValue({ data: sampleMockLogs, error: null });
    });

    it("should return summary for default week timeframe", async () => {
      const summary = await auditLogger.getAuditSummary();

      expect(summary.totalActions).toBe(5);
      expect(summary.uniqueUsers).toBe(3);
      expect(summary.topActions).toHaveLength(4);
      expect(summary.securityEvents).toBe(3);
      expect(summary.complianceEvents).toBe(3);
    });

    it("should return top 5 actions sorted by count", async () => {
      const summary = await auditLogger.getAuditSummary();

      expect(summary.topActions[0]).toEqual({ action: "USER_LOGIN", count: 2 });
    });

    it("should return empty summary on error", async () => {
      mocks.gte.mockResolvedValue({
        data: null,
        error: new Error("Query failed"),
      });

      const summary = await auditLogger.getAuditSummary();

      expect(summary).toEqual({
        totalActions: 0,
        uniqueUsers: 0,
        topActions: [],
        securityEvents: 0,
        complianceEvents: 0,
      });
    });

    it("should handle exceptions and return empty summary", async () => {
      mocks.gte.mockRejectedValue(new Error("Connection failed"));
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const summary = await auditLogger.getAuditSummary();

      expect(summary).toEqual({
        totalActions: 0,
        uniqueUsers: 0,
        topActions: [],
        securityEvents: 0,
        complianceEvents: 0,
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error generating audit summary:",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });

    it("should count security events by action prefix", async () => {
      mocks.gte.mockResolvedValue({
        data: [
          { user_id: "u1", action: "SECURITY_ALERT", metadata: {} },
          { user_id: "u2", action: "SECURITY_BREACH", metadata: {} },
        ],
        error: null,
      });

      const summary = await auditLogger.getAuditSummary();

      expect(summary.securityEvents).toBe(2);
    });
  });

  describe("Client Info", () => {
    it("should include client info in log entries", async () => {
      await auditLogger.log("TEST_ACTION", "test_resource", {});

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          ip_address: expect.any(String),
          user_agent: expect.any(String),
        }),
      ]);
    });
  });

  describe("Fallback Logging", () => {
    it("should limit fallback logs to 100 entries", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const existingLogs = Array(100).fill({ action: "OLD" });
      vi.spyOn(Storage.prototype, "getItem").mockReturnValue(
        JSON.stringify(existingLogs),
      );
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

      mocks.insert.mockResolvedValue({
        error: new Error("Limit of 100 fallback logs reached."),
      });

      await auditLogger.log("NEW_ACTION", "test", {});

      const savedLogs = JSON.parse(setItemSpy.mock.calls[0][1]);
      expect(savedLogs.length).toBe(100);
      expect(savedLogs[99].action).toBe("NEW_ACTION");
      consoleErrorSpy.mockRestore();
    });
  });

  describe("AuditLogEntry Interface", () => {
    it("should accept valid audit log entry structure", () => {
      const entry: AuditLogEntry = {
        user_id: "user-1",
        user_email: "user@example.com",
        action: "TEST",
        resource_type: "test",
        details: {},
        timestamp: new Date().toISOString(),
        severity: "low",
        status: "success",
      };

      expect(entry.user_id).toBe("user-1");
      expect(entry.severity).toBe("low");
      expect(entry.status).toBe("success");
    });

    it("should accept all optional fields", () => {
      const entry: AuditLogEntry = {
        id: "entry-1",
        user_id: "user-1",
        user_email: "user@example.com",
        action: "TEST",
        resource_type: "test",
        resource_id: "res-1",
        details: { key: "value" },
        ip_address: "127.0.0.1",
        user_agent: "Test Agent",
        session_id: "session-1",
        timestamp: new Date().toISOString(),
        severity: "critical",
        status: "failure",
        metadata: { custom: true },
      };

      expect(entry.id).toBe("entry-1");
      expect(entry.resource_id).toBe("res-1");
      expect(entry.ip_address).toBe("127.0.0.1");
      expect(entry.metadata?.custom).toBe(true);
    });
  });
});

// Integration-style tests for AuditLogger
describe("AuditLogger Integration", () => {
  let mocks: MockFns;

  beforeEach(() => {
    mocks = getMocks();
    vi.clearAllMocks();
    mockStorage = {};

    mocks.insert.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "integration-user",
          email: "integration@test.com",
        },
      },
    });

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => mockStorage[key] || null,
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
      (key: string, value: string) => {
        mockStorage[key] = value;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should log complete security workflow", async () => {
    // User logs in
    await auditLogger.logUserLogin();
    expect(mocks.insert).toHaveBeenCalledWith([
      expect.objectContaining({ action: "USER_LOGIN" }),
    ]);

    // User accesses data
    await auditLogger.logDataAccess("vulnerability", "CVE-2024-001", "read");
    expect(mocks.insert).toHaveBeenCalledWith([
      expect.objectContaining({ action: "DATA_READ" }),
    ]);

    // User generates report
    await auditLogger.logReportGeneration({
      endpointInventory: { totalEndpoints: 10 },
      vulnerabilitySummary: { totalCVEs: 5, bySeverity: { critical: 2 } },
    });
    expect(mocks.insert).toHaveBeenCalledWith([
      expect.objectContaining({ action: "REPORT_GENERATED" }),
    ]);

    // User downloads report
    await auditLogger.logReportDownload("PDF");
    expect(mocks.insert).toHaveBeenCalledWith([
      expect.objectContaining({ action: "REPORT_DOWNLOADED" }),
    ]);

    // User logs out
    await auditLogger.logUserLogout();
    expect(mocks.insert).toHaveBeenCalledWith([
      expect.objectContaining({ action: "USER_LOGOUT" }),
    ]);

    // Total 5 log calls
    expect(mocks.insert).toHaveBeenCalledTimes(5);
  });

  it("should handle security incident logging", async () => {
    await auditLogger.logSecurityEvent("unauthorized_access", {
      source_ip: "192.168.1.100",
      attempted_resource: "/admin/users",
      user_agent: "Suspicious Bot/1.0",
    });

    expect(mocks.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        action: "SECURITY_UNAUTHORIZED_ACCESS",
        severity: "critical",
        metadata: expect.objectContaining({
          requires_investigation: true,
        }),
      }),
    ]);
  });

  it("should track permission changes for compliance", async () => {
    const permissionChanges = [
      { role: "admin", permission: "user.delete", action: "granted" as const },
      {
        role: "analyst",
        permission: "report.generate",
        action: "granted" as const,
      },
      {
        role: "viewer",
        permission: "dashboard.view",
        action: "revoked" as const,
      },
    ];

    await auditLogger.logPermissionMatrixUpdate(permissionChanges);

    expect(mocks.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        action: "PERMISSION_MATRIX_UPDATED",
        details: expect.objectContaining({
          total_changes: 3,
          affected_roles: ["admin", "analyst", "viewer"],
        }),
        metadata: expect.objectContaining({
          compliance_relevant: true,
          security_relevant: true,
        }),
      }),
    ]);
  });
});
