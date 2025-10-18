"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Smartphone, Key, AlertTriangle, Copy, Check } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MFASetupProps {
  onComplete: () => void;
}

export function MFASetup({ onComplete }: MFASetupProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"setup" | "verify" | "backup">("setup");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSetupMFA = async () => {
    setLoading(true);
    setError("");

    try {
      // Generate a random secret for TOTP
      const mockSecret = generateSecret();
      const mockQRCode = `otpauth://totp/Komra%20Security:${user?.email}?secret=${mockSecret}&issuer=Komra%20Security`;
      
      setSecret(mockSecret);
      setQrCode(mockQRCode);
      
      // Log MFA setup initiation
      await supabase.rpc('log_mfa_event', {
        p_user_id: user?.id,
        p_event_type: 'setup',
        p_success: true
      });
      
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Failed to setup MFA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    setLoading(true);
    setError("");

    try {
      if (verificationCode.length !== 6) {
        throw new Error("Please enter a 6-digit verification code");
      }

      if (!/^\d{6}$/.test(verificationCode)) {
        throw new Error("Invalid verification code format");
      }

      // In production, verify the TOTP code against the secret
      // For demo, accept any 6-digit code
      
      // Store MFA secret in database
      const { error: updateError } = await supabase
        .from("users")
        .update({ 
          mfa_secret: secret,
          mfa_enabled: true,
          mfa_enabled_at: new Date().toISOString()
        })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      // Generate backup codes
      const codes = generateBackupCodes();
      setBackupCodes(codes);

      // Store backup codes (hashed in production)
      await supabase
        .from("users")
        .update({ mfa_backup_codes: codes })
        .eq("id", user?.id);

      // Log successful MFA enablement
      await supabase.rpc('log_mfa_event', {
        p_user_id: user?.id,
        p_event_type: 'enabled',
        p_success: true
      });

      setStep("backup");
    } catch (err: any) {
      setError(err.message || "Failed to verify MFA code");
      
      // Log failed verification
      await supabase.rpc('log_mfa_event', {
        p_user_id: user?.id,
        p_event_type: 'failed',
        p_success: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const generateSecret = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  };

  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const getRoleRequirement = () => {
    if (user?.role === "admin") {
      return {
        level: "Required",
        color: "bg-red-600",
        icon: <AlertTriangle className="h-4 w-4" />,
        description: "MFA is mandatory for administrative access"
      };
    } else if (user?.role === "analyst") {
      return {
        level: "Required",
        color: "bg-orange-600", 
        icon: <Shield className="h-4 w-4" />,
        description: "MFA is required for analyst privileges"
      };
    } else {
      return {
        level: "Optional",
        color: "bg-blue-600",
        icon: <Key className="h-4 w-4" />,
        description: "MFA is recommended for enhanced security"
      };
    }
  };

  const requirement = getRoleRequirement();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">
            Multi-Factor Authentication Setup
          </CardTitle>
          <CardDescription>
            Secure your account with an additional layer of protection
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-4">
            {requirement.icon}
            <Badge className={requirement.color}>
              {requirement.level}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {requirement.description}
          </p>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === "setup" && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Step 1: Install Authenticator App</h3>
                <p className="text-sm text-muted-foreground">
                  Download and install an authenticator app like Google Authenticator, 
                  Authy, or Microsoft Authenticator on your mobile device.
                </p>
              </div>
              
              <Button
                onClick={handleSetupMFA}
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate QR Code
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Step 2: Scan QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app:
                </p>
              </div>

              <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div className="w-32 h-32 mx-auto bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-xs text-gray-500">QR Code</p>
                </div>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{secret}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(secret)}
                  >
                    {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <Button
                onClick={handleVerifyMFA}
                className="w-full"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify and Enable MFA
              </Button>
            </div>
          )}

          {step === "backup" && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Step 3: Save Backup Codes</h3>
                <p className="text-sm text-muted-foreground">
                  Store these backup codes in a safe place. You can use them to access your account if you lose your device.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code key={index} className="text-xs bg-white px-2 py-1 rounded border">
                      {code}
                    </code>
                  ))}
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Each backup code can only be used once. Keep them secure and don't share them with anyone.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleComplete}
                className="w-full"
              >
                Complete Setup
              </Button>
            </div>
          )}

          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-medium">Security Notice</p>
                <p>
                  {user?.role === "admin" || user?.role === "analyst" 
                    ? "MFA is required for your role to ensure secure access to sensitive security data and systems."
                    : "MFA adds an extra layer of security to protect your account from unauthorized access."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}