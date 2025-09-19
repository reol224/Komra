import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOktaLogin, setShowOktaLogin] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleOktaLogin = () => {
    // In a real implementation, this would redirect to Okta
    setError(
      "Okta integration would redirect to your organization's Okta login page",
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">
            Koma Security Audit
          </CardTitle>
          <CardDescription>
            Sign in to access the vulnerability dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Okta SSO Option */}
          <div className="space-y-4 mb-6">
            <Button
              onClick={handleOktaLogin}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Sign in with Okta SSO
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                //required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-medium">Enhanced Security</p>
                <p>• Multi-Factor Authentication required for all users</p>
                <p>• Session timeouts prevent unauthorized access</p>
                <p>• Okta SSO integration for enterprise authentication</p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Demo Accounts:</p>
            <p>Admin: admin@koma.security</p>
            <p>Analyst: analyst@koma.security</p>
            <p>Viewer: viewer@koma.security</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
