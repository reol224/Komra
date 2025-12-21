import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  const insert = vi.fn();
  const select = vi.fn();
  const eq = vi.fn();
  const gte = vi.fn();
  const lte = vi.fn();
  const limit = vi.fn();
  const order = vi.fn();
  const getUser = vi.fn();

  // Store refs for test access
  (global as any).__supabaseMocksIntegration = {
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
import { auditLogger } from '@/lib/auditLogger';

// Helper to get mocks
const getMocks = () => (global as any).__supabaseMocksIntegration as MockFns;

describe('AuditLogger Integration Tests', () => {
  let mocks: MockFns;

  beforeEach(() => {
    mocks = getMocks();
    vi.clearAllMocks();
    mockStorage = {};

    // Setup default mock behaviors
    mocks.select.mockReturnThis();
    mocks.eq.mockReturnThis();
    mocks.gte.mockReturnThis();
    mocks.lte.mockReturnThis();
    mocks.limit.mockReturnThis();
    mocks.order.mockReturnThis();

    // Default successful insert
    mocks.insert.mockResolvedValue({ error: null });

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => mockStorage[key] || null
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        mockStorage[key] = value;
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Full User Session Workflow', () => {
    beforeEach(() => {
      mocks.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-session-123',
            email: 'session-user@example.com',
          },
        },
      });
    });

    it('should track complete analyst workflow', async () => {
      // Analyst logs in
      await auditLogger.logUserLogin();
      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'USER_LOGIN',
          user_id: 'user-session-123',
          user_email: 'session-user@example.com',
        }),
      ]);

      // Analyst views vulnerability list
      await auditLogger.logDataAccess('vulnerability', 'vuln-list', 'read');
      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'DATA_READ',
          resource_type: 'vulnerability',
        }),
      ]);

      // Analyst triages a specific vulnerability
      await auditLogger.logDataAccess('vulnerability', 'CVE-2024-1234', 'update');
      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'DATA_UPDATE',
          resource_id: 'CVE-2024-1234',
        }),
      ]);

      // Analyst generates a report
      await auditLogger.logReportGeneration({
        endpointInventory: { totalEndpoints: 150 },
        vulnerabilitySummary: { totalCVEs: 75, bySeverity: { critical: 10, high: 25 } },
        executiveSummary: { overallRiskRating: 'high' },
        metadata: { targetEnvironments: ['production', 'staging'], reportVersion: '2.0' },
      });
      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'REPORT_GENERATED',
          severity: 'high',
        }),
      ]);

      // Analyst downloads the report
      await auditLogger.logReportDownload('PDF');
      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'REPORT_DOWNLOADED',
          details: expect.objectContaining({
            download_format: 'PDF',
          }),
        }),
      ]);

      // Analyst emails the report
      await auditLogger.logReportEmail(['ciso@company.com', 'security-team@company.com']);
      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'REPORT_EMAILED',
          details: expect.objectContaining({
            recipient_count: 2,
          }),
        }),
      ]);

      // Analyst logs out
      await auditLogger.logUserLogout();
      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'USER_LOGOUT',
        }),
      ]);

      // Verify total number of audit log entries
      expect(mocks.insert).toHaveBeenCalledTimes(7);
    });

    it('should track admin permission management workflow', async () => {
      // Admin modifies permissions
      const permissionChanges = [
        { role: 'analyst', permission: 'vulnerability.triage', action: 'granted' as const },
        { role: 'analyst', permission: 'report.generate', action: 'granted' as const },
        { role: 'viewer', permission: 'dashboard.export', action: 'revoked' as const },
      ];

      await auditLogger.logPermissionMatrixUpdate(permissionChanges);

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'PERMISSION_MATRIX_UPDATED',
          severity: 'critical',
          details: expect.objectContaining({
            total_changes: 3,
            affected_roles: ['analyst', 'viewer'],
          }),
          metadata: expect.objectContaining({
            compliance_relevant: true,
            security_relevant: true,
          }),
        }),
      ]);
    });

    it('should track system configuration changes', async () => {
      // Admin changes MFA settings
      await auditLogger.logSystemChange('mfa_settings', {
        setting: 'mfa_required',
        old_value: false,
        new_value: true,
        reason: 'Security policy update',
      });

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'SYSTEM_MFA_SETTINGS',
          resource_type: 'system_configuration',
          severity: 'high',
          details: expect.objectContaining({
            change_type: 'mfa_settings',
            old_value: false,
            new_value: true,
          }),
        }),
      ]);

      // Admin changes password policy
      await auditLogger.logSystemChange('password_policy', {
        setting: 'min_length',
        old_value: 8,
        new_value: 12,
      });

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'SYSTEM_PASSWORD_POLICY',
          details: expect.objectContaining({
            old_value: 8,
            new_value: 12,
          }),
        }),
      ]);
    });
  });

  describe('Security Incident Response', () => {
    beforeEach(() => {
      mocks.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'security-responder-001',
            email: 'security@company.com',
          },
        },
      });
    });

    it('should log multiple related security events for an incident', async () => {
      const incidentId = 'INC-2024-001';

      // Initial detection
      await auditLogger.logSecurityEvent('suspicious_activity_detected', {
        incident_id: incidentId,
        source_ip: '192.168.1.100',
        target_resource: '/api/admin/users',
        threat_level: 'high',
      });

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'SECURITY_SUSPICIOUS_ACTIVITY_DETECTED',
          severity: 'critical',
          metadata: expect.objectContaining({
            requires_investigation: true,
          }),
        }),
      ]);

      // Investigation started
      await auditLogger.logSecurityEvent('investigation_started', {
        incident_id: incidentId,
        investigator: 'security@company.com',
        status: 'in_progress',
      });

      // Evidence collected
      await auditLogger.logDataAccess('audit_logs', incidentId, 'read');

      // Containment action
      await auditLogger.logSecurityEvent('containment_action', {
        incident_id: incidentId,
        action_taken: 'blocked_ip',
        blocked_ip: '192.168.1.100',
        status: 'success',
      });

      // Investigation complete
      await auditLogger.logSecurityEvent('investigation_complete', {
        incident_id: incidentId,
        finding: 'Brute force attack attempt',
        recommendation: 'Enable rate limiting',
        status: 'success',
      });

      // 5 log entries: detection, investigation start, evidence read, containment, completion
      expect(mocks.insert).toHaveBeenCalledTimes(5);
    });

    it('should handle failed authentication attempts', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null } });

      await auditLogger.logSecurityEvent('failed_login', {
        attempted_email: 'unknown@attacker.com',
        source_ip: '10.0.0.50',
        reason: 'invalid_credentials',
        attempt_count: 5,
        status: 'failure',
      });

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'SECURITY_FAILED_LOGIN',
          user_id: 'anonymous',
          user_email: 'anonymous@system.local',
          details: expect.objectContaining({
            attempted_email: 'unknown@attacker.com',
            attempt_count: 5,
          }),
        }),
      ]);
    });
  });

  describe('Compliance and Audit Trail', () => {
    beforeEach(() => {
      mocks.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'compliance-officer-001',
            email: 'compliance@company.com',
          },
        },
      });
    });

    it('should maintain complete data access trail', async () => {
      const resourceId = 'sensitive-data-001';

      // Read access
      await auditLogger.logDataAccess('pii_data', resourceId, 'read');

      // Update access
      await auditLogger.logDataAccess('pii_data', resourceId, 'update');

      // Delete access
      await auditLogger.logDataAccess('pii_data', resourceId, 'delete');

      // Export access
      await auditLogger.logDataAccess('pii_data', resourceId, 'export');

      expect(mocks.insert).toHaveBeenNthCalledWith(1, [
        expect.objectContaining({ action: 'DATA_READ' }),
      ]);
      expect(mocks.insert).toHaveBeenNthCalledWith(2, [
        expect.objectContaining({ action: 'DATA_UPDATE' }),
      ]);
      expect(mocks.insert).toHaveBeenNthCalledWith(3, [
        expect.objectContaining({ action: 'DATA_DELETE' }),
      ]);
      expect(mocks.insert).toHaveBeenNthCalledWith(4, [
        expect.objectContaining({ action: 'DATA_EXPORT' }),
      ]);

      expect(mocks.insert).toHaveBeenCalledTimes(4);
    });

    it('should support compliance report generation tracking', async () => {
      // Generate SOC2 compliance report
      await auditLogger.logReportGeneration({
        metadata: {
          reportType: 'compliance',
          framework: 'SOC2',
          period: '2024-Q1',
          reportVersion: '1.0',
        },
      });

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'REPORT_GENERATED',
          metadata: expect.objectContaining({
            compliance_relevant: true,
          }),
        }),
      ]);

      // Email to auditors
      await auditLogger.logReportEmail(['auditor@pwc.com', 'compliance@company.com']);

      expect(mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'REPORT_EMAILED',
          severity: 'high',
        }),
      ]);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should continue logging even when database is temporarily unavailable', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'user@test.com' } },
      });

      // First call fails
      mocks.insert.mockResolvedValueOnce({ error: new Error('Database unavailable') });
      await auditLogger.log('ACTION_1', 'resource', {});

      // Verify fallback to localStorage
      expect(mockStorage['audit_logs_fallback']).toBeDefined();
      const fallbackLogs = JSON.parse(mockStorage['audit_logs_fallback']);
      expect(fallbackLogs.length).toBe(1);

      // Second call succeeds
      mocks.insert.mockResolvedValueOnce({ error: null });
      await auditLogger.log('ACTION_2', 'resource', {});

      // Should have attempted insert twice
      expect(mocks.insert).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });

    it('should handle authentication service failures gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Auth service throws an error
      mocks.getUser.mockRejectedValueOnce(new Error('Auth service unavailable'));

      await auditLogger.log('TEST_ACTION', 'test_resource', {});

      // Should have logged the error but not crashed
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Audit logging failed:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should correctly attribute actions to different users', async () => {
      // First user's action
      mocks.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-001', email: 'admin@company.com' } },
      });
      await auditLogger.logUserLogin();

      // Second user's action
      mocks.getUser.mockResolvedValueOnce({
        data: { user: { id: 'analyst-002', email: 'analyst@company.com' } },
      });
      await auditLogger.logDataAccess('vulnerability', 'CVE-2024-001', 'read');

      // Third user's action
      mocks.getUser.mockResolvedValueOnce({
        data: { user: { id: 'viewer-003', email: 'viewer@company.com' } },
      });
      await auditLogger.logReportDownload('CSV');

      expect(mocks.insert).toHaveBeenNthCalledWith(1, [
        expect.objectContaining({
          user_id: 'admin-001',
          user_email: 'admin@company.com',
          action: 'USER_LOGIN',
        }),
      ]);

      expect(mocks.insert).toHaveBeenNthCalledWith(2, [
        expect.objectContaining({
          user_id: 'analyst-002',
          user_email: 'analyst@company.com',
          action: 'DATA_READ',
        }),
      ]);

      expect(mocks.insert).toHaveBeenNthCalledWith(3, [
        expect.objectContaining({
          user_id: 'viewer-003',
          user_email: 'viewer@company.com',
          action: 'REPORT_DOWNLOADED',
        }),
      ]);
    });
  });

  describe('Audit Log Retrieval', () => {
    beforeEach(() => {
      mocks.getUser.mockResolvedValue({
        data: { user: { id: 'admin-001', email: 'admin@company.com' } },
      });
    });

    it('should retrieve audit logs successfully', async () => {
      const mockLogs = [
        { id: '1', action: 'USER_LOGIN', user_id: 'user-1', timestamp: '2024-01-15T10:00:00Z' },
        { id: '2', action: 'DATA_READ', user_id: 'user-1', timestamp: '2024-01-15T10:05:00Z' },
        { id: '3', action: 'USER_LOGOUT', user_id: 'user-1', timestamp: '2024-01-15T10:30:00Z' },
      ];

      mocks.order.mockResolvedValue({ data: mockLogs, error: null });

      const logs = await auditLogger.getAuditLogs();

      expect(logs).toHaveLength(3);
      expect(logs[0].action).toBe('USER_LOGIN');
      expect(logs[2].action).toBe('USER_LOGOUT');
    });

    it('should retrieve audit summary for timeframes', async () => {
      const mockLogs = [
        { user_id: 'user-1', action: 'USER_LOGIN', metadata: { security_relevant: true } },
        { user_id: 'user-1', action: 'USER_LOGIN', metadata: { security_relevant: true } },
        { user_id: 'user-2', action: 'REPORT_GENERATED', metadata: { compliance_relevant: true } },
        { user_id: 'user-3', action: 'SECURITY_EVENT', metadata: { security_relevant: true } },
        { user_id: 'user-3', action: 'PERMISSION_MATRIX_UPDATED', metadata: { compliance_relevant: true } },
      ];

      mocks.gte.mockResolvedValue({ data: mockLogs, error: null });

      const summary = await auditLogger.getAuditSummary('week');

      expect(summary.totalActions).toBe(5);
      expect(summary.uniqueUsers).toBe(3);
      expect(summary.topActions[0]).toEqual({ action: 'USER_LOGIN', count: 2 });
      expect(summary.securityEvents).toBe(3);
      expect(summary.complianceEvents).toBe(2);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle vulnerability disclosure workflow', async () => {
      mocks.getUser.mockResolvedValue({
        data: { user: { id: 'security-analyst', email: 'analyst@company.com' } },
      });

      // Vulnerability discovered
      await auditLogger.logSecurityEvent('vulnerability_discovered', {
        cve_id: 'CVE-2024-9999',
        severity: 'critical',
        affected_systems: ['web-server-01', 'web-server-02'],
        discoverer: 'security-analyst',
      });

      // Vulnerability triaged
      await auditLogger.logDataAccess('vulnerability', 'CVE-2024-9999', 'update');

      // Patch notification sent
      await auditLogger.log('PATCH_NOTIFICATION_SENT', 'vulnerability', {
        cve_id: 'CVE-2024-9999',
        notified_teams: ['devops', 'security'],
      });

      // Remediation completed
      await auditLogger.logSecurityEvent('remediation_complete', {
        cve_id: 'CVE-2024-9999',
        patch_applied: true,
        verified_by: 'security-analyst',
        status: 'success',
      });

      expect(mocks.insert).toHaveBeenCalledTimes(4);

      // Verify first call - vulnerability discovered
      expect(mocks.insert).toHaveBeenNthCalledWith(1, [
        expect.objectContaining({
          action: 'SECURITY_VULNERABILITY_DISCOVERED',
          severity: 'critical',
        }),
      ]);

      // Verify last call - remediation complete
      expect(mocks.insert).toHaveBeenNthCalledWith(4, [
        expect.objectContaining({
          action: 'SECURITY_REMEDIATION_COMPLETE',
          status: 'success',
        }),
      ]);
    });

    it('should handle endpoint onboarding workflow', async () => {
      mocks.getUser.mockResolvedValue({
        data: { user: { id: 'infra-admin', email: 'infra@company.com' } },
      });

      // New endpoint registered
      await auditLogger.log('ENDPOINT_REGISTERED', 'endpoint', {
        hostname: 'new-server-01',
        environment: 'production',
        ip_address: '10.0.1.50',
      });

      // Agent installed
      await auditLogger.log('AGENT_INSTALLED', 'endpoint', {
        hostname: 'new-server-01',
        agent_version: '2.5.0',
      });

      // Initial scan completed
      await auditLogger.log('INITIAL_SCAN_COMPLETED', 'endpoint', {
        hostname: 'new-server-01',
        vulnerabilities_found: 12,
        scan_duration_seconds: 45,
      });

      expect(mocks.insert).toHaveBeenCalledTimes(3);
    });
  });
});
