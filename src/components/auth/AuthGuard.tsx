"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import { MFAEnforcementGuard } from "@/components/auth/MFAEnforcementGuard";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm />;
  }

  // Check MFA enforcement after authentication
  return (
    <MFAEnforcementGuard>
      {children}
    </MFAEnforcementGuard>
  );
}

// Also export as default for flexibility
export default AuthGuard;