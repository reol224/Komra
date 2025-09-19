"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import VulnerabilitySummary from "@/components/dashboard/VulnerabilitySummary";
import EndpointInventory from "@/components/dashboard/EndpointInventory";
import RiskAssessment from "@/components/dashboard/RiskAssessment";
import TriageInterface from "@/components/dashboard/TriageInterface";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Security Audit Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive vulnerability assessment and management
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <VulnerabilitySummary />
          <EndpointInventory />
          <RiskAssessment />
          <TriageInterface />
        </div>
      </div>
    </AuthGuard>
  );
}