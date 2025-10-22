"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MFASetup } from "./MFASetup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield } from "lucide-react";
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
  const { user, refreshUser } = useAuth();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showViewerDialog, setShowViewerDialog] = useState(false);
  const [setupMFA, setSetupMFA] = useState(false);
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
      // Fetch current MFA status from database
      const { data, error } = await supabase
        .from("users")
        .select("mfa_enabled")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error checking MFA status:", error);
        setLoading(false);
        return;
      }

      const mfaEnabled = data?.mfa_enabled || false;

      // Check if user's role requires MFA
      const requiresMFA = MFA_REQUIRED_ROLES.includes(user.role);

      if (requiresMFA) {
        // Admin/Analyst: If mfa_enabled is false, force setup
        setMfaRequired(!mfaEnabled);
        setShowViewerDialog(false);
      } else if (user.role === "viewer") {
        // Viewer: If mfa_enabled is false, show dialog (not forced)
        setMfaRequired(false);
        setShowViewerDialog(!mfaEnabled);
      } else {
        setMfaRequired(false);
        setShowViewerDialog(false);
      }
    } catch (error) {
      console.error("Error in MFA check:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMFAComplete = async () => {
    if (!user) return;

    try {
      // Refresh user data to get updated MFA status
      await refreshUser();

      // Refresh MFA status
      await checkMFAStatus();
      setSetupMFA(false);
    } catch (error) {
      console.error("Error completing MFA setup:", error);
    }
  };

  const handleSetupNow = () => {
    setShowViewerDialog(false);
    setSetupMFA(true);
  };

  const handleRemindLater = () => {
    setShowViewerDialog(false);
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

  // Show MFA setup if required but not enabled (Admin/Analyst only) or viewer chose to set up
  if (mfaRequired || setupMFA) {
    return <MFASetup onComplete={handleMFAComplete} />;
  }

  // Show dialog for viewers with MFA disabled
  return (
    <>
      <AlertDialog open={showViewerDialog} onOpenChange={setShowViewerDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <AlertDialogTitle>Enable Multi-Factor Authentication</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              We recommend enabling MFA to add an extra layer of security to your account. 
              This helps protect your data and ensures only you can access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRemindLater}>
              Remind me later
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSetupNow}>
              Set up now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {children}
    </>
  );
}