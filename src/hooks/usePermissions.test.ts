import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";

// Mock permissions data
const mockPermissions = {
  "dashboard.view": true,
  "users.manage": true,
  "reports.generate": true,
  "settings.edit": false,
  "audit.view": true,
};

// Mock the AuthContext
const mockUser = {
  id: "123",
  email: "test@example.com",
  role: "admin" as const,
  session_id: "session-123",
};

let mockUserValue: typeof mockUser | null = mockUser;

// Create a hoisted mock function using vi.hoisted
const { mockGetRolePermissions } = vi.hoisted(() => ({
  mockGetRolePermissions: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUserValue,
  }),
}));

vi.mock("@/lib/permissionService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/permissionService")>();
  return {
    ...actual,
    permissionService: {
      ...actual.permissionService,
      getRolePermissions: mockGetRolePermissions,
    },
  };
});

import { usePermissions, usePermission } from "@/hooks/usePermissions";

describe("usePermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserValue = mockUser;
    mockGetRolePermissions.mockResolvedValue(mockPermissions);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("initial state", () => {
    it("should start with loading true", async () => {
      const { result } = renderHook(() => usePermissions());

      // Initial state should be loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("should load permissions when user has role", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetRolePermissions).toHaveBeenCalledWith("admin");
      expect(result.current.permissions).toEqual(mockPermissions);
    });

    it("should set empty permissions when user is null", async () => {
      mockUserValue = null;

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions).toEqual({});
      expect(mockGetRolePermissions).not.toHaveBeenCalled();
    });
  });

  describe("hasPermission", () => {
    it("should return true for granted permission", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission("dashboard.view")).toBe(true);
      expect(result.current.hasPermission("users.manage")).toBe(true);
      expect(result.current.hasPermission("reports.generate")).toBe(true);
    });

    it("should return false for denied permission", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission("settings.edit")).toBe(false);
    });

    it("should return false for non-existent permission", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission("nonexistent.permission")).toBe(
        false,
      );
    });
  });

  describe("hasAnyPermission", () => {
    it("should return true if any permission is granted", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(
        result.current.hasAnyPermission(["dashboard.view", "settings.edit"]),
      ).toBe(true);
      expect(
        result.current.hasAnyPermission(["nonexistent", "users.manage"]),
      ).toBe(true);
    });

    it("should return false if no permissions are granted", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(
        result.current.hasAnyPermission(["settings.edit", "nonexistent"]),
      ).toBe(false);
    });

    it("should return false for empty array", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAnyPermission([])).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("should return true if all permissions are granted", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(
        result.current.hasAllPermissions(["dashboard.view", "users.manage"]),
      ).toBe(true);
      expect(
        result.current.hasAllPermissions([
          "dashboard.view",
          "reports.generate",
          "audit.view",
        ]),
      ).toBe(true);
    });

    it("should return false if any permission is denied", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(
        result.current.hasAllPermissions(["dashboard.view", "settings.edit"]),
      ).toBe(false);
    });

    it("should return false if any permission is missing", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(
        result.current.hasAllPermissions(["dashboard.view", "nonexistent"]),
      ).toBe(false);
    });

    it("should return true for empty array", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAllPermissions([])).toBe(true);
    });
  });

  describe("canAccess", () => {
    it("should combine resource and action into permission id", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canAccess("dashboard", "view")).toBe(true);
      expect(result.current.canAccess("users", "manage")).toBe(true);
      expect(result.current.canAccess("settings", "edit")).toBe(false);
    });

    it("should return false for non-existent resource/action", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canAccess("unknown", "action")).toBe(false);
    });
  });

  describe("refreshPermissions", () => {
    it("should reload permissions from service", async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetRolePermissions).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refreshPermissions();
      });

      expect(mockGetRolePermissions).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("should set empty permissions on error (fail-closed security)", async () => {
      mockGetRolePermissions.mockRejectedValueOnce(
        new Error("Cannot get role permissions"),
      );

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Fail-closed: empty permissions on error for security
      expect(result.current.permissions).toEqual({});
      // No permissions should be granted
      expect(result.current.hasPermission("dashboard.view")).toBe(false);
      expect(result.current.hasPermission("vulnerabilities.view")).toBe(false);
      expect(result.current.hasPermission("users.create")).toBe(false);
      expect(result.current.hasPermission("system.config")).toBe(false);
    });
  });
});

describe("usePermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserValue = mockUser;
    mockGetRolePermissions.mockResolvedValue(mockPermissions);
  });

  it("should return hasPermission true for granted permission", async () => {
    const { result } = renderHook(() => usePermission("dashboard.view"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasPermission).toBe(true);
  });

  it("should return hasPermission false for denied permission", async () => {
    const { result } = renderHook(() => usePermission("settings.edit"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasPermission).toBe(false);
  });

  it("should return loading state", async () => {
    const { result } = renderHook(() => usePermission("dashboard.view"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
