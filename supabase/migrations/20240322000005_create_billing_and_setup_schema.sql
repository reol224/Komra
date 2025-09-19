CREATE TABLE IF NOT EXISTS billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'siem',
  status TEXT NOT NULL DEFAULT 'active',
  license_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS environment_provisioning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE CASCADE,
  environment_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'provisioning',
  provisioned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT,
  phone_number TEXT,
  setup_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(billing_account_id, username)
);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_stripe_customer ON billing_accounts(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_license_key ON billing_accounts(license_key);
CREATE INDEX IF NOT EXISTS idx_environment_provisioning_billing_account ON environment_provisioning(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_admin_setup_billing_account ON admin_setup(billing_account_id);

alter publication supabase_realtime add table billing_accounts;
alter publication supabase_realtime add table environment_provisioning;
alter publication supabase_realtime add table admin_setup;