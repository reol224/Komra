"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Shield } from "lucide-react";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <PermissionGuard permission="dashboard.view" fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-slate-300">You don't have permission to access the dashboard.</p>
          </div>
        </div>
      }>
        <DashboardLayout />
      </PermissionGuard>
    </AuthGuard>
  );
}