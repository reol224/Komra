"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MFASetup } from "./MFASetup";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MFAEnforcementGuardProps {
  children: React.ReactNode;
}

// Roles that require MFA
const MFA_REQUIRED_ROLES = ["admin", "analyst"];

export function MFAEnforcementGuard({ children }: MFAEnforcementGuardProps) {
  const { user } = useAuth();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMFAStatus();
  }, [user]);

  const checkMFAStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user's role requires MFA
      const requiresMFA = MFA_REQUIRED_ROLES.includes(user.role);

      if (!requiresMFA) {
        setMfaRequired(false);
        setLoading(false);
        return;
      }

      // Check if user has MFA enabled
      const { data, error } = await supabase
        .from("users")
        .select("mfa_enabled, mfa_secret")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error checking MFA status:", error);
        setMfaRequired(true);
        setLoading(false);
        return;
      }

      // If MFA is required but not enabled, show setup
      setMfaRequired(!data?.mfa_enabled);
    } catch (error) {
      console.error("Error in MFA check:", error);
      setMfaRequired(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMFAComplete = async () => {
    if (!user) return;

    try {
      // Update user's MFA status in database
      const { error } = await supabase
        .from("users")
        .update({ 
          mfa_enabled: true,
          mfa_enabled_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating MFA status:", error);
        return;
      }

      // Refresh MFA status
      setMfaRequired(false);
    } catch (error) {
      console.error("Error completing MFA setup:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking security settings...</p>
        </div>
      </div>
    );
  }

  // Show MFA setup if required but not enabled
  if (mfaRequired) {
    return <MFASetup onComplete={handleMFAComplete} />;
  }

  // MFA is satisfied, show protected content
  return <>{children}</>;
}
