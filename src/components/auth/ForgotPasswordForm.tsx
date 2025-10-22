"use client";

import React, { useState } from "react";
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
import { Loader2, Shield, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/passwordResetService";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await requestPasswordReset(email);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="flex justify-start mb-2">
            <Link href="/homepage">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </Link>
          </div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold text-white">
            Reset Password
          </CardTitle>
          <CardDescription className="text-slate-300">
            Enter your email address and we'll send you a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="border-green-600 bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-300">
                  If an account exists with this email, a password reset link has been sent. 
                  Please check your inbox and follow the instructions.
                </AlertDescription>
              </Alert>
              <div className="text-center">
                <Link href="/homepage">
                  <Button 
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>

              <div className="text-center">
                <Link href="/homepage">
                  <Button 
                    variant="link"
                    className="text-slate-400 hover:text-white"
                  >
                    Back to Login
                  </Button>
                </Link>
              </div>
            </form>
          )}

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-slate-700 rounded-lg border border-slate-600">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="text-xs text-slate-300">
                <p className="font-medium text-white">Security Notice</p>
                <p>• Reset links expire after 1 hour</p>
                <p>• For security, we don't reveal if an email exists</p>
                <p>• Contact support if you need additional help</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
