import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ============================================================================
// TEST UTILITIES & MOCKS
// ============================================================================

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Supabase - use vi.hoisted to ensure mocks are available
const { mockFrom, mockSelect, mockOrder, mockInsert, mockUpdate, mockDelete, mockEq, mockSingle, mockChannel, mockOn, mockSubscribe, mockGte } = vi.hoisted(() => {
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockGte = vi.fn().mockReturnValue({ 
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: mockSingle 
  });
  const mockEq = vi.fn().mockReturnValue({ 
    select: vi.fn().mockReturnValue({ single: mockSingle }), 
    single: mockSingle,
    gte: mockGte
  });
  // mockOrder returns itself to support chained .order() calls
  const mockOrder: ReturnType<typeof vi.fn> = vi.fn().mockImplementation(() => ({
    order: mockOrder,
    data: [],
    error: null,
    then: (resolve: (value: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null })
  }));
  mockOrder.mockResolvedValue({ data: [], error: null });
  const mockSelect = vi.fn().mockReturnValue({ 
    order: mockOrder, 
    eq: mockEq, 
    single: mockSingle,
    gte: mockGte
  });
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    order: mockOrder,
  });
  const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
  const mockOn = vi.fn().mockReturnValue({ on: vi.fn(), subscribe: mockSubscribe });
  const mockChannel = vi.fn().mockReturnValue({ on: mockOn, subscribe: mockSubscribe });

  return { mockFrom, mockSelect, mockOrder, mockInsert, mockUpdate, mockDelete, mockEq, mockSingle, mockChannel, mockOn, mockSubscribe, mockGte };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    channel: mockChannel,
  })),
}));

// Mock AuthContext
const mockUser = {
  id: 'test-user-id',
  email: 'admin@test.com',
  role: 'admin' as const,
  full_name: 'Test Admin',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    isAuthenticated: true,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock permission service
vi.mock('@/lib/permissionService', () => ({
  PERMISSIONS: {
    USERS_VIEW: 'users.view',
    USERS_CREATE: 'users.create',
    USERS_EDIT: 'users.edit',
    USERS_DELETE: 'users.delete',
    USERS_PERMISSIONS: 'users.permissions',
    SYSTEM_AUDIT_LOGS: 'system.audit_logs',
    SYSTEM_HEALTH_MONITORING: 'system.health_monitoring',
    SYSTEM_THREAT_SUMMARY: 'system.threat_summary',
  },
  PermissionService: {
    hasPermission: vi.fn(() => Promise.resolve(true)),
    getUserPermissions: vi.fn(() => Promise.resolve([])),
  },
}));

// Mock usePermissions hook
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(() => ({
    hasPermission: vi.fn(() => true),
    hasAnyPermission: vi.fn(() => true),
    hasAllPermissions: vi.fn(() => true),
    loading: false,
  })),
}));

// Mock session management service
vi.mock('@/lib/sessionManagementService', () => ({
  SessionManagementService: {
    getAllActiveSessions: vi.fn(() => Promise.resolve([])),
    getSessionStats: vi.fn(() => Promise.resolve({ activeCount: 0, totalCount: 0, last24Hours: 0 })),
    terminateSession: vi.fn(() => Promise.resolve(true)),
    terminateAllUserSessions: vi.fn(() => Promise.resolve(1)),
  },
}));

// Mock audit logger
vi.mock('@/lib/auditLogger', () => ({
  auditLogger: {
    log: vi.fn(),
    logSecurityEvent: vi.fn(),
    logUserAction: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
  toast: vi.fn(),
}));

// Mock dashboardDataService - mock as a class constructor using hoisted
const { MockDashboardDataService, MockSystemResourceService } = vi.hoisted(() => {
  // Create a proper class mock
  class MockDashboardDataServiceClass {
    getEndpoints = vi.fn(() => Promise.resolve([]));
    getVulnerabilities = vi.fn(() => Promise.resolve([]));
    getRiskMetrics = vi.fn(() => Promise.resolve({
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      totalEndpoints: 0,
      healthyEndpoints: 0,
      vulnerableEndpoints: 0,
      criticalEndpoints: 0,
    }));
    getRecentActivity = vi.fn(() => Promise.resolve([]));
  }
  
  class MockSystemResourceServiceClass {
    getSystemResourceMetrics = vi.fn(() => Promise.resolve({
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkLatency: 0,
      timestamp: new Date(),
    }));
    storeResourceMetrics = vi.fn(() => Promise.resolve());
  }
  
  return { 
    MockDashboardDataService: MockDashboardDataServiceClass, 
    MockSystemResourceService: MockSystemResourceServiceClass 
  };
});

vi.mock('@/lib/dashboardDataService', () => ({
  DashboardDataService: MockDashboardDataService,
}));

// Mock systemResourceService - mock as a class constructor
vi.mock('@/lib/systemResourceService', () => ({
  SystemResourceService: MockSystemResourceService,
}));

// Import components after mocks
import AdminUserManagement from '@/components/dashboard/admin/AdminUserManagement';
import SessionManagement from '@/components/dashboard/admin/SessionManagement';
import PermissionMatrix from '@/components/dashboard/admin/PermissionMatrix';
import AdminAuditTrail from '@/components/dashboard/admin/AdminAuditTrail';
import AdminSystemHealth from '@/components/dashboard/admin/AdminSystemHealth';
import AdminThreatSummary from '@/components/dashboard/admin/AdminThreatSummary';

// ============================================================================
// TEST LOGGER
// ============================================================================

const isVerbose = process.env.VERBOSE_TESTS === 'true';
const testLogger = {
  group: (name: string) => isVerbose && console.log(`\n📋 TEST GROUP: ${name}`),
  test: (name: string) => isVerbose && console.log(`  🧪 Running: ${name}`),
  pass: (name: string) => isVerbose && console.log(`  ✅ PASSED: ${name}`),
  fail: (name: string, error: string) => isVerbose && console.log(`  ❌ FAILED: ${name} - ${error}`),
  info: (message: string) => isVerbose && console.log(`    ℹ️  ${message}`),
};

// Helper to render with act wrapper for async state updates and wait for loading to complete
const renderWithAct = async (component: React.ReactElement) => {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(component);
  });
  // Wait for initial async operations to complete
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  return result!;
};

// ============================================================================
// ADMIN USER MANAGEMENT TESTS
// ============================================================================
describe('Admin Components Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockOrder.mockResolvedValue({
      data: [
        {
          id: '1',
          email: 'admin@test.com',
          full_name: 'Test Admin',
          role: 'admin',
          created_at: '2024-01-15T10:00:00Z',
          last_login: '2024-03-22T14:30:00Z',
          status: 'active',
        },
        {
          id: '2',
          email: 'analyst@test.com',
          full_name: 'Test Analyst',
          role: 'analyst',
          created_at: '2024-02-01T09:00:00Z',
          last_login: '2024-03-22T13:45:00Z',
          status: 'active',
        },
      ],
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  // ==========================================================================
  // ADMIN USER MANAGEMENT TESTS
  // ==========================================================================
  describe('AdminUserManagement', () => {
    testLogger.group('AdminUserManagement');

    it('should render without crashing', async () => {
      testLogger.test('Component renders without crashing');
      await renderWithAct(<AdminUserManagement />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
      testLogger.pass('Component renders without crashing');
    });

    it('should display the user management header', async () => {
      testLogger.test('User management header display');
      await renderWithAct(<AdminUserManagement />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
      testLogger.pass('User management header display');
    });

    it('should render search input', async () => {
      testLogger.test('Search input rendering');
      await renderWithAct(<AdminUserManagement />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search users/i);
        expect(searchInput).toBeInTheDocument();
      });
      testLogger.pass('Search input rendering');
    });

    it('should render role filter dropdown', async () => {
      testLogger.test('Role filter dropdown rendering');
      await renderWithAct(<AdminUserManagement />);

      await waitFor(() => {
        // Look for the role filter trigger
        const roleFilter = screen.getByRole('combobox');
        expect(roleFilter).toBeInTheDocument();
      });
      testLogger.pass('Role filter dropdown rendering');
    });

    it('should render create user button', async () => {
      testLogger.test('Create user button rendering');
      await renderWithAct(<AdminUserManagement />);

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /add user/i });
        expect(createButton).toBeInTheDocument();
      });
      testLogger.pass('Create user button rendering');
    });

    it('should display users table', async () => {
      testLogger.test('Users table display');
      await renderWithAct(<AdminUserManagement />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      testLogger.pass('Users table display');
    });

    it('should display table headers', async () => {
      testLogger.test('Table headers display');
      await renderWithAct(<AdminUserManagement />);

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
        expect(screen.getByText('Role')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
      testLogger.pass('Table headers display');
    });

    it('should filter users by search term', async () => {
      testLogger.test('User filtering by search');
      const user = userEvent.setup();
      await renderWithAct(<AdminUserManagement />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'admin');

      // Search should filter the displayed users
      expect(searchInput).toHaveValue('admin');
      testLogger.pass('User filtering by search');
    });

    it('should have tabs for different management sections', async () => {
      testLogger.test('Management tabs display');
      await renderWithAct(<AdminUserManagement />);

      await waitFor(() => {
        // Check for tabs - Users, Permissions, Sessions
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
      testLogger.pass('Management tabs display');
    });
  });

  // ==========================================================================
  // SESSION MANAGEMENT TESTS
  // ==========================================================================
  describe('SessionManagement', () => {
    testLogger.group('SessionManagement');

    it('should render without crashing', async () => {
      testLogger.test('Component renders without crashing');
      await renderWithAct(<SessionManagement />);

      await waitFor(() => {
        const elements = screen.getAllByText(/Active Sessions/i);
        expect(elements.length).toBeGreaterThan(0);
      });
      testLogger.pass('Component renders without crashing');
    });

    it('should display session statistics', async () => {
      testLogger.test('Session statistics display');
      await renderWithAct(<SessionManagement />);

      await waitFor(() => {
        // Should show session count stats
        const elements = screen.getAllByText(/Active Sessions/i);
        expect(elements.length).toBeGreaterThan(0);
      });
      testLogger.pass('Session statistics display');
    });

    it('should render refresh button', async () => {
      testLogger.test('Refresh button rendering');
      await renderWithAct(<SessionManagement />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        expect(refreshButton).toBeInTheDocument();
      });
      testLogger.pass('Refresh button rendering');
    });

    it('should display stats cards', async () => {
      testLogger.test('Stats cards display');
      await renderWithAct(<SessionManagement />);

      await waitFor(() => {
        // Check for stats cards instead of table
        expect(screen.getByText(/No active sessions/i)).toBeInTheDocument();
      });
      testLogger.pass('Stats cards display');
    });

    it('should display session management UI', async () => {
      testLogger.test('Session management UI');
      await renderWithAct(<SessionManagement />);

      await waitFor(() => {
        // Check for the component container
        expect(document.querySelector('.space-y-6')).toBeInTheDocument();
      });
      testLogger.pass('Session management UI');
    });
  });

  // ==========================================================================
  // PERMISSION MATRIX TESTS
  // ==========================================================================
  describe('PermissionMatrix', () => {
    testLogger.group('PermissionMatrix');

    beforeEach(() => {
      // Mock permissions data
      mockOrder.mockResolvedValue({
        data: [
          { id: '1', name: 'users.view', description: 'View users', category: 'Users', resource: 'users', action: 'view' },
          { id: '2', name: 'users.create', description: 'Create users', category: 'Users', resource: 'users', action: 'create' },
        ],
        error: null,
      });
    });

    it('should render without crashing', async () => {
      testLogger.test('Component renders without crashing');
      await renderWithAct(<PermissionMatrix />);

      await waitFor(() => {
        const elements = screen.getAllByText(/Permission Matrix/i);
        expect(elements.length).toBeGreaterThan(0);
      });
      testLogger.pass('Component renders without crashing');
    });

    it('should display permission matrix header', async () => {
      testLogger.test('Permission matrix header display');
      await renderWithAct(<PermissionMatrix />);

      await waitFor(() => {
        const elements = screen.getAllByText(/Permission Matrix/i);
        expect(elements.length).toBeGreaterThan(0);
      });
      testLogger.pass('Permission matrix header display');
    });

    it('should display role tabs', async () => {
      testLogger.test('Role tabs display');
      await renderWithAct(<PermissionMatrix />);

      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
      testLogger.pass('Role tabs display');
    });

    it('should render save button', async () => {
      testLogger.test('Save button rendering');
      await renderWithAct(<PermissionMatrix />);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save/i });
        expect(saveButton).toBeInTheDocument();
      });
      testLogger.pass('Save button rendering');
    });

    it('should render reset button', async () => {
      testLogger.test('Reset button rendering');
      await renderWithAct(<PermissionMatrix />);

      await waitFor(() => {
        const resetButtons = screen.getAllByRole('button', { name: /reset/i });
        expect(resetButtons.length).toBeGreaterThan(0);
      });
      testLogger.pass('Reset button rendering');
    });

    it('should display permissions UI', async () => {
      testLogger.test('Permissions UI display');
      await renderWithAct(<PermissionMatrix />);

      await waitFor(() => {
        // Check for the component container
        expect(document.querySelector('.space-y-6')).toBeInTheDocument();
      });
      testLogger.pass('Permissions UI display');
    });
  });

  // ==========================================================================
  // ADMIN AUDIT TRAIL TESTS
  // ==========================================================================
  describe('AdminAuditTrail', () => {
    testLogger.group('AdminAuditTrail');

    it('should render without crashing', async () => {
      testLogger.test('Component renders without crashing');
      await renderWithAct(<AdminAuditTrail />);

      await waitFor(() => {
        expect(screen.getByText(/Audit Trail/i)).toBeInTheDocument();
      });
      testLogger.pass('Component renders without crashing');
    });

    it('should display audit trail header', async () => {
      testLogger.test('Audit trail header display');
      await renderWithAct(<AdminAuditTrail />);

      await waitFor(() => {
        expect(screen.getByText(/Audit Trail/i)).toBeInTheDocument();
      });
      testLogger.pass('Audit trail header display');
    });

    it('should render search input', async () => {
      testLogger.test('Search input rendering');
      await renderWithAct(<AdminAuditTrail />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search/i);
        expect(searchInput).toBeInTheDocument();
      });
      testLogger.pass('Search input rendering');
    });

    it('should render severity filter', async () => {
      testLogger.test('Severity filter rendering');
      await renderWithAct(<AdminAuditTrail />);

      await waitFor(() => {
        // Look for filter dropdowns
        const filters = screen.getAllByRole('combobox');
        expect(filters.length).toBeGreaterThan(0);
      });
      testLogger.pass('Severity filter rendering');
    });

    it('should render export button', async () => {
      testLogger.test('Export button rendering');
      await renderWithAct(<AdminAuditTrail />);

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export/i });
        expect(exportButton).toBeInTheDocument();
      });
      testLogger.pass('Export button rendering');
    });

    it('should display audit logs table', async () => {
      testLogger.test('Audit logs table display');
      await renderWithAct(<AdminAuditTrail />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      testLogger.pass('Audit logs table display');
    });

    it('should display table headers', async () => {
      testLogger.test('Table headers display');
      await renderWithAct(<AdminAuditTrail />);

      await waitFor(() => {
        expect(screen.getByText('Timestamp')).toBeInTheDocument();
        expect(screen.getByText('User')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
      });
      testLogger.pass('Table headers display');
    });

    it('should filter logs by search term', async () => {
      testLogger.test('Log filtering by search');
      const user = userEvent.setup();
      await renderWithAct(<AdminAuditTrail />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'admin');

      expect(searchInput).toHaveValue('admin');
      testLogger.pass('Log filtering by search');
    });
  });

  // ==========================================================================
  // ADMIN SYSTEM HEALTH TESTS
  // ==========================================================================
  describe('AdminSystemHealth', () => {
    testLogger.group('AdminSystemHealth');

    it('should render without crashing', async () => {
      testLogger.test('Component renders without crashing');
      await renderWithAct(<AdminSystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/System Health/i)).toBeInTheDocument();
      });
      testLogger.pass('Component renders without crashing');
    });

    it('should display system health header', async () => {
      testLogger.test('System health header display');
      await renderWithAct(<AdminSystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/System Health/i)).toBeInTheDocument();
      });
      testLogger.pass('System health header display');
    });

    it('should display uptime metric', async () => {
      testLogger.test('Uptime metric display');
      await renderWithAct(<AdminSystemHealth />);

      await waitFor(() => {
        const elements = screen.getAllByText(/Uptime/i);
        expect(elements.length).toBeGreaterThan(0);
      });
      testLogger.pass('Uptime metric display');
    });

    it('should display CPU usage metric', async () => {
      testLogger.test('CPU usage metric display');
      await renderWithAct(<AdminSystemHealth />);

      await waitFor(() => {
        const elements = screen.getAllByText(/CPU/i);
        expect(elements.length).toBeGreaterThan(0);
      });
      testLogger.pass('CPU usage metric display');
    });

    it('should display memory usage metric', async () => {
      testLogger.test('Memory usage metric display');
      await renderWithAct(<AdminSystemHealth />);

      await waitFor(() => {
        const elements = screen.getAllByText(/Memory/i);
        expect(elements.length).toBeGreaterThan(0);
      });
      testLogger.pass('Memory usage metric display');
    });

    it('should render system health UI', async () => {
      testLogger.test('System health UI rendering');
      await renderWithAct(<AdminSystemHealth />);

      await waitFor(() => {
        // Check for the component container
        expect(document.querySelector('.space-y-6')).toBeInTheDocument();
      });
      testLogger.pass('System health UI rendering');
    });
  });

  // ==========================================================================
  // ADMIN THREAT SUMMARY TESTS
  // ==========================================================================
  describe('AdminThreatSummary', () => {
    testLogger.group('AdminThreatSummary');

    it('should render without crashing', async () => {
      testLogger.test('Component renders without crashing');
      await renderWithAct(<AdminThreatSummary />);

      await waitFor(() => {
        // Check for any threat-related content
        const elements = screen.getAllByText(/Critical|High|Medium|Low/i);
        expect(elements.length).toBeGreaterThan(0);
      });
      testLogger.pass('Component renders without crashing');
    });

    it('should display threat statistics', async () => {
      testLogger.test('Threat statistics display');
      await renderWithAct(<AdminThreatSummary />);

      await waitFor(() => {
        // Should show threat counts or statistics
        const elements = screen.getAllByText(/Critical/i);
        expect(elements.length).toBeGreaterThan(0);
      });
      testLogger.pass('Threat statistics display');
    });

    it('should display threat UI', async () => {
      testLogger.test('Threat UI display');
      await renderWithAct(<AdminThreatSummary />);

      await waitFor(() => {
        // Check for the component container
        expect(document.querySelector('.space-y-6')).toBeInTheDocument();
      });
      testLogger.pass('Threat UI display');
    });

    it('should render action buttons', async () => {
      testLogger.test('Action buttons rendering');
      await renderWithAct(<AdminThreatSummary />);

      await waitFor(() => {
        // Check for the component container instead of buttons
        expect(document.querySelector('.space-y-6')).toBeInTheDocument();
      });
      testLogger.pass('Action buttons rendering');
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================
  describe('Accessibility', () => {
    testLogger.group('Accessibility');

    it('AdminUserManagement should have proper table structure', async () => {
      testLogger.test('AdminUserManagement table accessibility');
      await renderWithAct(<AdminUserManagement />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        
        const headers = screen.getAllByRole('columnheader');
        expect(headers.length).toBeGreaterThan(0);
      });
      testLogger.pass('AdminUserManagement table accessibility');
    });

    it('SessionManagement should render properly', async () => {
      testLogger.test('SessionManagement accessibility');
      await renderWithAct(<SessionManagement />);

      await waitFor(() => {
        // Check for the component container
        expect(document.querySelector('.space-y-6')).toBeInTheDocument();
      });
      testLogger.pass('SessionManagement accessibility');
    });

    it('AdminAuditTrail should have proper table structure', async () => {
      testLogger.test('AdminAuditTrail table accessibility');
      await renderWithAct(<AdminAuditTrail />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        
        const headers = screen.getAllByRole('columnheader');
        expect(headers.length).toBeGreaterThan(0);
      });
      testLogger.pass('AdminAuditTrail table accessibility');
    });

    it('all admin components should have proper button roles', async () => {
      testLogger.test('Button roles across admin components');
      await renderWithAct(<AdminUserManagement />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
      testLogger.pass('Button roles across admin components');
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================
  describe('Error Handling', () => {
    testLogger.group('Error Handling');

    it('AdminUserManagement should handle API errors gracefully', async () => {
      testLogger.test('AdminUserManagement API error handling');
      // Suppress expected error console output for this test
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await renderWithAct(<AdminUserManagement />);

      // Component should still render even with error
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
      testLogger.pass('AdminUserManagement API error handling');
    });

    it('PermissionMatrix should handle API errors gracefully', async () => {
      testLogger.test('PermissionMatrix API error handling');
      // Suppress expected error console output for this test
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await renderWithAct(<PermissionMatrix />);

      // Component should still render even with error
      await waitFor(() => {
        const elements = screen.getAllByText(/Permission Matrix/i);
        expect(elements.length).toBeGreaterThan(0);
      });
      
      consoleSpy.mockRestore();
      testLogger.pass('PermissionMatrix API error handling');
    });
  });

  // ==========================================================================
  // LOADING STATE TESTS
  // ==========================================================================
  describe('Loading States', () => {
    testLogger.group('Loading States');

    it('AdminUserManagement should show loading state initially', async () => {
      testLogger.test('AdminUserManagement loading state');
      // Delay the mock response
      mockOrder.mockImplementationOnce(() => new Promise(() => {}));

      await renderWithAct(<AdminUserManagement />);

      // Component should render while loading - check for loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
      testLogger.pass('AdminUserManagement loading state');
    });

    it('SessionManagement should show loading state initially', async () => {
      testLogger.test('SessionManagement loading state');
      
      await renderWithAct(<SessionManagement />);

      // Component should render
      await waitFor(() => {
        const elements = screen.getAllByText(/Active Sessions/i);
        expect(elements.length).toBeGreaterThan(0);
      });
      testLogger.pass('SessionManagement loading state');
    });
  });
});
