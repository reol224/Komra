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
import { Loader2, Shield, ExternalLink } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Mock authentication - in real app would call auth service
      if (email && password) {
        console.log("Login successful");
      } else {
        throw new Error("Please enter email and password");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleOktaLogin = () => {
    setError(
      "Okta integration would redirect to your organization's Okta login page",
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold text-white">
            Komra Security Audit
          </CardTitle>
          <CardDescription className="text-slate-300">
            Sign in to access the vulnerability dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Okta SSO Option */}
          <div className="space-y-4 mb-6">
            <Button
              onClick={handleOktaLogin}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              disabled={loading}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Sign in with Okta SSO
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-slate-700 rounded-lg border border-slate-600">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="text-xs text-slate-300">
                <p className="font-medium text-white">Enhanced Security</p>
                <p>• Multi-Factor Authentication required for all users</p>
                <p>• Session timeouts prevent unauthorized access</p>
                <p>• Okta SSO integration for enterprise authentication</p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-slate-400">
            <p className="text-slate-300">Demo Accounts:</p>
            <p>Admin: admin@komra.security</p>
            <p>Analyst: analyst@komra.security</p>
            <p>Viewer: viewer@komra.security</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginForm;