"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { verifyResetToken, resetPassword } from "@/lib/passwordResetService";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { PasswordValidationResult } from "@/lib/passwordValidation";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setError("Invalid reset link");
      setVerifying(false);
      return;
    }

    const result = await verifyResetToken(token);
    setTokenValid(result.valid);
    setVerifying(false);

    if (!result.valid) {
      setError("This reset link is invalid or has expired");
    }
  };

  const handlePasswordValidationChange = (result: PasswordValidationResult | null) => {
    setPasswordValidation(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Check password validation result
    if (passwordValidation && !passwordValidation.isValid) {
      const errorMessages = passwordValidation.errors
        .filter(e => e.severity === 'error')
        .map(e => e.message)
        .join('. ');
      setError(errorMessages || "Password does not meet security requirements");
      setLoading(false);
      return;
    }

    // Basic length check as fallback
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword(token, password);
      
      if (result.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/homepage");
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 my-auto">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold text-white">
            Set New Password
          </CardTitle>
          <CardDescription className="text-slate-300">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tokenValid ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="text-center">
                <Link href="/forgot-password">
                  <Button 
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    Request New Reset Link
                  </Button>
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <Alert className="border-green-600 bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-300">
                  Your password has been reset successfully! Redirecting to login...
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                {/* Real-time Password Strength Indicator */}
                <PasswordStrengthIndicator
                  password={password}
                  onValidationChange={handlePasswordValidationChange}
                  showRequirements={true}
                  showSuggestions={true}
                  showStrengthBar={true}
                  checkCompromised={true}
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                disabled={loading || (passwordValidation !== null && !passwordValidation.isValid)}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </form>
          )}

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-slate-700 rounded-lg border border-slate-600">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="text-xs text-slate-300">
                <p className="font-medium text-white">Advanced Password Requirements</p>
                <p>• Minimum 8 characters (or 15+ for passphrase)</p>
                <p>• Uppercase, lowercase, number, and special character</p>
                <p>• No keyboard patterns (qwerty, 12345)</p>
                <p>• No dictionary words or common passwords</p>
                <p>• Not found in known data breaches</p>
                <p>• Cannot contain your username or email</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
