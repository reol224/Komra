'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Loader2, Key, AlertTriangle, Smartphone, Shield } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { sanitizeEmail, sanitizeText } from '@/lib/sanitization';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SetupFlowProps {
  licenseKey?: string;
  stripeCustomerId?: string;
}

export default function SetupFlow({ licenseKey, stripeCustomerId }: SetupFlowProps = {}) {
  const [currentPhase, setCurrentPhase] = useState<'provisioning' | 'admin-setup' | 'mfa-setup' | 'complete'>('provisioning');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [billingAccountId, setBillingAccountId] = useState<string | null>(null);
  
  // Admin setup form state
  const [adminForm, setAdminForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  // MFA setup state
  const [mfaSecret, setMfaSecret] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Fetch billing account ID on mount if stripeCustomerId is provided
  React.useEffect(() => {
    const fetchBillingAccount = async () => {
      if (stripeCustomerId) {
        try {
          const { data, error } = await supabase
            .from('billing_accounts')
            .select('id')
            .eq('stripe_customer_id', stripeCustomerId)
            .single();

          if (error) {
            console.error('Failed to fetch billing account:', error);
          } else if (data) {
            setBillingAccountId(data.id);
          }
        } catch (err) {
          console.error('Error fetching billing account:', err);
        }
      }
    };

    fetchBillingAccount();
  }, [stripeCustomerId]);

  // Start provisioning automatically
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPhase('admin-setup');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeEmail(adminForm.email);
      const sanitizedUsername = sanitizeText(adminForm.username, 50);
      
      if (adminForm.password !== adminForm.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      
      if (adminForm.password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }
      
      setLoading(true);
      
      // Create user in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email: sanitizedEmail,
          full_name: sanitizedUsername,
          role: 'admin',
          status: 'active',
        })
        .select()
        .single();

      if (userError) throw userError;
      
      setUserId(userData.id);

      // Hash and store password using database function
      const { error: passwordError } = await supabase.rpc('update_user_password', {
        p_user_id: userData.id,
        p_password: adminForm.password
      });

      if (passwordError) throw passwordError;

      // Also populate admin_setup table if billing account exists
      if (billingAccountId) {
        const { error: adminSetupError } = await supabase
          .from('admin_setup')
          .insert({
            billing_account_id: billingAccountId,
            username: sanitizedUsername,
            password_hash: 'managed_by_user_passwords_table',
            mfa_enabled: false, // Will be updated after MFA setup
            setup_completed: false, // Will be updated after MFA setup
          });

        if (adminSetupError && adminSetupError.code !== '23505') { // Ignore duplicate errors
          console.error('Failed to create admin_setup record:', adminSetupError);
        }
      }

      // Move to MFA setup (mandatory for admin)
      setCurrentPhase('mfa-setup');
      await initializeMFA(sanitizedEmail);
      
    } catch (err: any) {
      setError(err.message || "Failed to create admin account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initializeMFA = async (email: string) => {
    try {
      // Generate TOTP secret
      const newSecret = authenticator.generateSecret();
      setMfaSecret(newSecret);

      // Generate OTP Auth URL
      const otpauthUrl = authenticator.keyuri(
        email,
        'Komra Security',
        newSecret
      );

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
      setQrCodeDataUrl(qrDataUrl);
    } catch (err: any) {
      setError(err.message || "Failed to initialize MFA");
    }
  };

  const handleMFAVerification = async () => {
    setError(null);
    
    try {
      if (mfaCode.length !== 6) {
        throw new Error("Please enter a 6-digit verification code");
      }

      if (!/^\d{6}$/.test(mfaCode)) {
        throw new Error("Invalid verification code format");
      }

      setLoading(true);

      // Verify the TOTP code
      const isValid = authenticator.verify({
        token: mfaCode,
        secret: mfaSecret,
      });

      if (!isValid) {
        throw new Error("Invalid verification code. Please try again.");
      }

      // Store MFA secret in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          mfa_secret: mfaSecret,
          mfa_enabled: true,
          mfa_enabled_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Generate backup codes
      const codes = generateBackupCodes();
      setBackupCodes(codes);

      // Store backup codes
      await supabase
        .from('users')
        .update({ mfa_backup_codes: codes })
        .eq('id', userId);

      // Log MFA enablement
      await supabase.rpc('log_mfa_event', {
        p_user_id: userId,
        p_event_type: 'enabled',
        p_success: true,
      });

      setCurrentPhase('complete');
    } catch (err: any) {
      setError(err.message || "Failed to verify MFA code");
      
      // Log failed verification
      if (userId) {
        await supabase.rpc('log_mfa_event', {
          p_user_id: userId,
          p_event_type: 'failed',
          p_success: false,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const renderProvisioningPhase = () => (
    <Card className="w-full max-w-2xl mx-auto bg-slate-800 border-slate-700">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
          <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold text-white">
          Setting Up Your Environment
        </CardTitle>
        <CardDescription className="text-slate-400">
          Please wait while we provision your security monitoring environment
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-slate-300">Payment processed successfully</span>
          </div>
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
            <span className="text-sm text-slate-300">Provisioning security infrastructure...</span>
          </div>
          <div className="flex items-center space-x-3 opacity-50">
            <div className="h-5 w-5 rounded-full border-2 border-slate-600" />
            <span className="text-sm text-slate-500">Configuring monitoring agents</span>
          </div>
          <div className="flex items-center space-x-3 opacity-50">
            <div className="h-5 w-5 rounded-full border-2 border-slate-600" />
            <span className="text-sm text-slate-500">Setting up admin access</span>
          </div>
        </div>
        
        <Alert className="bg-orange-500/10 border-orange-500/50">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-slate-300">
            This process typically takes 2-3 minutes. Please do not close this window.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderAdminSetupPhase = () => (
    <Card className="w-full max-w-2xl mx-auto bg-slate-800 border-slate-700">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
          <Key className="h-6 w-6 text-green-500" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold text-white">
          Create Admin Account
        </CardTitle>
        <CardDescription className="text-slate-400">
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
            <Label htmlFor="email" className="text-slate-300">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={adminForm.email}
              onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="admin@company.com"
              className="bg-slate-900 border-slate-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-slate-300">Full Name</Label>
            <Input
              id="username"
              type="text"
              value={adminForm.username}
              onChange={(e) => setAdminForm(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your full name"
              className="bg-slate-900 border-slate-600 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input
              id="password"
              type="password"
              value={adminForm.password}
              onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter secure password"
              className="bg-slate-900 border-slate-600 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={adminForm.confirmPassword}
              onChange={(e) => setAdminForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm your password"
              className="bg-slate-900 border-slate-600 text-white"
              required
            />
          </div>
          
          <Alert className="bg-orange-500/10 border-orange-500/50">
            <Shield className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-slate-300">
              <strong>MFA is mandatory for admin accounts.</strong> You will be required to set up multi-factor authentication in the next step.
            </AlertDescription>
          </Alert>
          
          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
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

  const renderMFASetupPhase = () => (
    <Card className="w-full max-w-2xl mx-auto bg-slate-800 border-slate-700">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
          <Smartphone className="h-6 w-6 text-orange-500" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold text-white">
          Setup Multi-Factor Authentication
        </CardTitle>
        <CardDescription className="text-slate-400">
          Scan the QR code with your authenticator app
        </CardDescription>
        <Badge className="mt-2 bg-red-600">Required for Admin Access</Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white p-6 rounded-lg text-center">
          {qrCodeDataUrl && (
            <img
              src={qrCodeDataUrl}
              alt="MFA QR Code"
              className="w-48 h-48 mx-auto"
            />
          )}
          <div className="mt-4">
            <code className="text-xs bg-slate-100 px-3 py-2 rounded break-all">
              {mfaSecret}
            </code>
            <p className="text-xs text-slate-600 mt-2">
              Can't scan? Enter this code manually in your authenticator app
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mfaCode" className="text-slate-300">Verification Code</Label>
          <Input
            id="mfaCode"
            type="text"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="bg-slate-900 border-slate-600 text-white text-center text-2xl tracking-widest"
            required
          />
          <p className="text-xs text-slate-400">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <Button 
          onClick={handleMFAVerification}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
          size="lg"
          disabled={loading || mfaCode.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify and Continue'
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const renderCompletePhase = () => (
    <Card className="w-full max-w-2xl mx-auto bg-slate-800 border-slate-700">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="h-6 w-6 text-green-500" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold text-green-500">
          Setup Complete!
        </CardTitle>
        <CardDescription className="text-slate-400">
          Your Komra SIEM environment is ready for use
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
            <Label className="text-xs text-slate-500">Environment ID</Label>
            <p className="font-mono text-sm text-white">ENV-{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
            <Label className="text-xs text-slate-500">License Key</Label>
            <p className="font-mono text-sm text-white">LIC-{licenseKey?.substr(0, 8).toUpperCase() || 'XXXXXXXX'}</p>
          </div>
        </div>

        <Alert className="bg-orange-500/10 border-orange-500/50">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-slate-300">
            <strong>Save Your Backup Codes</strong>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {backupCodes.map((code, index) => (
                <code key={index} className="text-xs bg-slate-900 px-2 py-1 rounded">
                  {code}
                </code>
              ))}
            </div>
            <p className="text-xs mt-2">Store these codes securely. Each can only be used once.</p>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <h4 className="font-medium text-white">Next Steps:</h4>
          <ul className="space-y-2 text-sm text-slate-300">
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
        
        <Button 
          className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
          size="lg"
          onClick={() => window.location.href = '/dashboard'}
        >
          Access Security Dashboard
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['provisioning', 'admin-setup', 'mfa-setup', 'complete'].map((phase, index) => (
              <div key={phase} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentPhase === phase 
                    ? 'bg-orange-500 text-white' 
                    : index < ['provisioning', 'admin-setup', 'mfa-setup', 'complete'].indexOf(currentPhase)
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-12 h-0.5 ${
                    index < ['provisioning', 'admin-setup', 'mfa-setup', 'complete'].indexOf(currentPhase)
                      ? 'bg-green-500'
                      : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <p className="text-sm text-slate-400 capitalize">
              {currentPhase.replace('-', ' ')} Phase
            </p>
          </div>
        </div>

        {/* Phase content */}
        {currentPhase === 'provisioning' && renderProvisioningPhase()}
        {currentPhase === 'admin-setup' && renderAdminSetupPhase()}
        {currentPhase === 'mfa-setup' && renderMFASetupPhase()}
        {currentPhase === 'complete' && renderCompletePhase()}
      </div>
    </div>
  );
}