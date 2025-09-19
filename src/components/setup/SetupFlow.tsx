"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, CheckCircle, AlertTriangle, Smartphone, Key } from "lucide-react";

interface SetupFlowProps {
  licenseKey?: string;
  stripeCustomerId?: string;
}

export default function SetupFlow({ licenseKey, stripeCustomerId }: SetupFlowProps = {}) {
  const [currentPhase, setCurrentPhase] = useState<'purchase' | 'provisioning' | 'admin-setup' | 'complete'>('purchase');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Admin setup form state
  const [adminForm, setAdminForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    mfaEnabled: false,
    phoneNumber: '',
    authenticatorApp: false
  });

  const handlePurchaseComplete = async (customerId: string) => {
    setLoading(true);
    setCurrentPhase('provisioning');
    
    // Simulate environment provisioning
    setTimeout(() => {
      setCurrentPhase('admin-setup');
      setLoading(false);
    }, 3000);
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (adminForm.password !== adminForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (adminForm.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    setLoading(true);
    
    try {
      // Here you would call your API to create the admin account
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setCurrentPhase('complete');
    } catch (err) {
      setError("Failed to create admin account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderPurchasePhase = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold">
          Komra SIEM Plan
        </CardTitle>
        <CardDescription>
          Complete your purchase to get started with enterprise security monitoring
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Plan Features:</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• Real-time vulnerability monitoring</li>
            <li>• Multi-environment support</li>
            <li>• Advanced threat detection</li>
            <li>• Compliance reporting</li>
            <li>• 24/7 security alerts</li>
          </ul>
        </div>
        
        <Button 
          onClick={() => handlePurchaseComplete('cus_test123')} 
          className="w-full"
          size="lg"
        >
          Complete Purchase with Stripe
        </Button>
        
        <p className="text-xs text-center text-gray-500">
          Secure payment processing powered by Stripe
        </p>
      </CardContent>
    </Card>
  );

  const renderProvisioningPhase = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <Loader2 className="h-6 w-6 text-yellow-600 animate-spin" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold">
          Setting Up Your Environment
        </CardTitle>
        <CardDescription>
          Please wait while we provision your security monitoring environment
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm">Payment processed successfully</span>
          </div>
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="text-sm">Provisioning security infrastructure...</span>
          </div>
          <div className="flex items-center space-x-3 opacity-50">
            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
            <span className="text-sm text-gray-500">Configuring monitoring agents</span>
          </div>
          <div className="flex items-center space-x-3 opacity-50">
            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
            <span className="text-sm text-gray-500">Setting up admin access</span>
          </div>
        </div>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This process typically takes 2-3 minutes. Please do not close this window.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderAdminSetupPhase = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Key className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold">
          Create Admin Account
        </CardTitle>
        <CardDescription>
          Set up your first administrator account to access the security dashboard
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleAdminSetup} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={adminForm.username}
              onChange={(e) => setAdminForm(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter admin username"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={adminForm.password}
              onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter secure password"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={adminForm.confirmPassword}
              onChange={(e) => setAdminForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Multi-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                checked={adminForm.mfaEnabled}
                onCheckedChange={(checked) => setAdminForm(prev => ({ ...prev, mfaEnabled: checked }))}
              />
            </div>
          </div>
          
          {adminForm.mfaEnabled && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                MFA Setup Options
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (SMS)</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={adminForm.phoneNumber}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="authenticatorApp"
                  checked={adminForm.authenticatorApp}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, authenticatorApp: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="authenticatorApp" className="text-sm">
                  Use authenticator app (Google Authenticator, Authy, etc.)
                </Label>
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Admin Account'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderCompletePhase = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold text-green-600">
          Setup Complete!
        </CardTitle>
        <CardDescription>
          Your Komra SIEM environment is ready for use
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <Label className="text-xs text-gray-500">Environment ID</Label>
            <p className="font-mono text-sm">ENV-{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <Label className="text-xs text-gray-500">License Key</Label>
            <p className="font-mono text-sm">LIC-{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium">Next Steps:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">1</Badge>
              Install monitoring agents on your endpoints
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">2</Badge>
              Configure your first security policies
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">3</Badge>
              Set up alert notifications
            </li>
          </ul>
        </div>
        
        <Button className="w-full" size="lg">
          Access Security Dashboard
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['purchase', 'provisioning', 'admin-setup', 'complete'].map((phase, index) => (
              <div key={phase} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentPhase === phase 
                    ? 'bg-blue-600 text-white' 
                    : index < ['purchase', 'provisioning', 'admin-setup', 'complete'].indexOf(currentPhase)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-12 h-0.5 ${
                    index < ['purchase', 'provisioning', 'admin-setup', 'complete'].indexOf(currentPhase)
                      ? 'bg-green-600'
                      : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <p className="text-sm text-gray-600 capitalize">
              {currentPhase.replace('-', ' ')} Phase
            </p>
          </div>
        </div>

        {/* Phase content */}
        {currentPhase === 'purchase' && renderPurchasePhase()}
        {currentPhase === 'provisioning' && renderProvisioningPhase()}
        {currentPhase === 'admin-setup' && renderAdminSetupPhase()}
        {currentPhase === 'complete' && renderCompletePhase()}
      </div>
    </div>
  );
}