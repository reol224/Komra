import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import VulnerabilitySummary from '@/components/dashboard/VulnerabilitySummary';
import EndpointInventory from '@/components/dashboard/EndpointInventory';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the DashboardDataService class
vi.mock('@/lib/dashboardDataService', () => {
  const mockService = {
    getVulnerabilities: vi.fn(() => Promise.resolve([])),
    getEndpoints: vi.fn(() => Promise.resolve([])),
    getRiskMetrics: vi.fn(() => Promise.resolve({
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      totalEndpoints: 0,
      healthyEndpoints: 0,
      vulnerableEndpoints: 0,
      criticalEndpoints: 0,
    })),
  };

  const MockDashboardDataService = function() {
    return mockService;
  };

  return {
    DashboardDataService: MockDashboardDataService,
    default: MockDashboardDataService,
  };
});

// Wrapper component with AuthProvider
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('VulnerabilitySummary', () => {
    it('should render without crashing', () => {
      const { container } = render(<VulnerabilitySummary />, { wrapper: Wrapper });
      expect(container).toBeTruthy();
    });
  });
  
  describe('EndpointInventory', () => {
    it('should render without crashing', () => {
      const { container } = render(<EndpointInventory />, { wrapper: Wrapper });
      expect(container).toBeTruthy();
    });
  });
});