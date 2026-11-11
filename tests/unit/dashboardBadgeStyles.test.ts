import { describe, expect, it } from "vitest";
import {
  getAccountStatusBadgeClassName,
  getSeverityBadgeClassName,
  getSeverityChartColor,
  getSeverityTextClassName,
  getStatusBadgeClassName,
  getStatusChartColor,
  getStatusTextClassName,
} from "@/lib/dashboardBadgeStyles";

describe("dashboard badge styles", () => {
  it("uses the same severity palette for priorities across views", () => {
    expect(getSeverityBadgeClassName("critical")).toContain("bg-red-600");
    expect(getSeverityBadgeClassName("high")).toContain("bg-orange-600");
    expect(getSeverityBadgeClassName("medium")).toContain("bg-yellow-300");
    expect(getSeverityBadgeClassName("low")).toContain("bg-blue-600");
    expect(getSeverityTextClassName("low")).toBe("text-blue-600");
    expect(getSeverityChartColor("high")).toBe("#ea580c");
  });

  it("normalizes workflow status spelling before selecting colors", () => {
    expect(getStatusBadgeClassName("In Progress")).toContain("bg-yellow-300");
    expect(getStatusBadgeClassName("in-progress")).toContain("bg-yellow-300");
    expect(getStatusBadgeClassName("resolved")).toContain("bg-green-600");
    expect(getStatusBadgeClassName("open")).toContain("bg-red-600");
    expect(getStatusTextClassName("In Progress")).toBe("text-yellow-600");
    expect(getStatusChartColor("resolved")).toBe("#16a34a");
  });

  it("keeps active account status positive while active alerts remain urgent", () => {
    expect(getAccountStatusBadgeClassName("active")).toContain("bg-green-600");
    expect(getStatusBadgeClassName("active")).toContain("bg-red-600");
  });
});
