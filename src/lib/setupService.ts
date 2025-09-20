import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface BillingAccount {
  id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  plan_type: string;
  status: string;
  license_key: string;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentProvisioning {
  id: string;
  billing_account_id: string;
  environment_id: string;
  status: 'provisioning' | 'active' | 'failed';
  provisioned_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSetup {
  id: string;
  billing_account_id: string;
  username: string;
  password_hash: string;
  mfa_enabled: boolean;
  mfa_secret?: string;
  phone_number?: string;
  setup_completed: boolean;
  created_at: string;
  updated_at: string;
}

export class SetupService {
  // Generate a unique license key
  static generateLicenseKey(): string {
    const prefix = 'KOMRA';
    const random = randomBytes(8).toString('hex').toUpperCase();
    return `${prefix}-${random.slice(0, 4)}-${random.slice(4, 8)}-${random.slice(8, 12)}`;
  }

  // Generate environment ID
  static generateEnvironmentId(): string {
    const prefix = 'ENV';
    const random = randomBytes(6).toString('hex').toUpperCase();
    return `${prefix}-${random}`;
  }

  // Create billing account after Stripe purchase
  static async createBillingAccount(stripeCustomerId: string, subscriptionId?: string): Promise<BillingAccount> {
    const licenseKey = this.generateLicenseKey();
    
    const { data, error } = await supabase
      .from('billing_accounts')
      .insert({
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: subscriptionId,
        plan_type: 'siem',
        status: 'active',
        license_key: licenseKey
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create billing account: ${error.message}`);
    return data;
  }

  // Start environment provisioning
  static async startEnvironmentProvisioning(billingAccountId: string): Promise<EnvironmentProvisioning> {
    const environmentId = this.generateEnvironmentId();
    
    const { data, error } = await supabase
      .from('environment_provisioning')
      .insert({
        billing_account_id: billingAccountId,
        environment_id: environmentId,
        status: 'provisioning'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to start provisioning: ${error.message}`);
    
    // Simulate async provisioning process
    setTimeout(async () => {
      await this.completeEnvironmentProvisioning(data.id);
    }, 3000);

    return data;
  }

  // Complete environment provisioning
  static async completeEnvironmentProvisioning(provisioningId: string): Promise<void> {
    const { error } = await supabase
      .from('environment_provisioning')
      .update({
        status: 'active',
        provisioned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', provisioningId);

    if (error) throw new Error(`Failed to complete provisioning: ${error.message}`);
  }

  // Create admin account
  static async createAdminAccount(
    billingAccountId: string,
    username: string,
    password: string,
    mfaEnabled: boolean = false,
    phoneNumber?: string
  ): Promise<AdminSetup> {
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Generate MFA secret if enabled
    let mfaSecret: string | undefined;
    if (mfaEnabled) {
      mfaSecret = randomBytes(20).toString('hex');
    }

    const { data, error } = await supabase
      .from('admin_setup')
      .insert({
        billing_account_id: billingAccountId,
        username,
        password_hash: passwordHash,
        mfa_enabled: mfaEnabled,
        mfa_secret: mfaSecret,
        phone_number: phoneNumber,
        setup_completed: true
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create admin account: ${error.message}`);
    return data;
  }

  // Get billing account by license key
  static async getBillingAccountByLicenseKey(licenseKey: string): Promise<BillingAccount | null> {
    const { data, error } = await supabase
      .from('billing_accounts')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (error) return null;
    return data;
  }

  // Get billing account by Stripe customer ID
  static async getBillingAccountByStripeCustomer(stripeCustomerId: string): Promise<BillingAccount | null> {
    const { data, error } = await supabase
      .from('billing_accounts')
      .select('*')
      .eq('stripe_customer_id', stripeCustomerId)
      .single();

    if (error) return null;
    return data;
  }

  // Check if admin setup is complete
  static async isAdminSetupComplete(billingAccountId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('admin_setup')
      .select('setup_completed')
      .eq('billing_account_id', billingAccountId)
      .eq('setup_completed', true)
      .single();

    return !error && data?.setup_completed === true;
  }

  // Get environment status
  static async getEnvironmentStatus(billingAccountId: string): Promise<EnvironmentProvisioning | null> {
    const { data, error } = await supabase
      .from('environment_provisioning')
      .select('*')
      .eq('billing_account_id', billingAccountId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  // Validate admin credentials
  static async validateAdminCredentials(username: string, password: string): Promise<AdminSetup | null> {
    const { data, error } = await supabase
      .from('admin_setup')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) return null;

    const isValidPassword = await bcrypt.compare(password, data.password_hash);
    if (!isValidPassword) return null;

    return data;
  }
}