"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import VulnerabilitySummary from "@/components/dashboard/VulnerabilitySummary";
import EndpointInventory from "@/components/dashboard/EndpointInventory";
import RiskAssessment from "@/components/dashboard/RiskAssessment";
import TriageInterface from "@/components/dashboard/TriageInterface";
import { Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-900">
        {/* Navigation */}
        <nav className="bg-slate-800 border-b border-slate-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-orange-500" />
                <span className="text-xl font-bold text-white">Komra Security</span>
              </Link>
              <div className="flex items-center gap-4">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                  Settings
                </Button>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Profile
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Security Audit Dashboard
            </h1>
            <p className="text-slate-300">
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
      </div>
    </AuthGuard>
  );
}