"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Smartphone, Key, AlertTriangle } from "lucide-react";

interface MFASetupProps {
  onComplete: () => void;
}

export function MFASetup({ onComplete }: MFASetupProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSetupMFA = async () => {
    setLoading(true);
    setError("");

    try {
      // In a real implementation, this would call your MFA setup API
      // For demo purposes, we'll simulate the setup
      const mockSecret = "JBSWY3DPEHPK3PXP";
      const mockQRCode = `otpauth://totp/Koma%20Security:${user?.email}?secret=${mockSecret}&issuer=Koma%20Security`;
      
      setSecret(mockSecret);
      setQrCode(mockQRCode);
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

      // In a real implementation, this would verify the TOTP code
      // For demo purposes, we'll accept any 6-digit code
      if (!/^\d{6}$/.test(verificationCode)) {
        throw new Error("Invalid verification code format");
      }

      // Mark MFA as enabled for the user
      // In real implementation, this would update the user's MFA status in the database
      onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to verify MFA code");
    } finally {
      setLoading(false);
    }
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
        level: "Required",
        color: "bg-blue-600",
        icon: <Key className="h-4 w-4" />,
        description: "MFA is required for all users"
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

              {/* QR Code placeholder - in real implementation, use a QR code library */}
              <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div className="w-32 h-32 mx-auto bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-xs text-gray-500">QR Code</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Manual entry key: <code className="bg-gray-100 px-1 rounded">{secret}</code>
                </p>
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

          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-medium">Security Notice</p>
                <p>MFA is required for all users to ensure secure access to sensitive security data and systems.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}