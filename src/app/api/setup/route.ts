import { NextRequest, NextResponse } from 'next/server';
import { SetupService } from '@/lib/setupService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stripe_customer_id, stripe_subscription_id } = body;

    if (!stripe_customer_id) {
      return NextResponse.json(
        { error: 'Stripe customer ID is required' },
        { status: 400 }
      );
    }

    // Check if billing account already exists
    const existingAccount = await SetupService.getBillingAccountByStripeCustomer(stripe_customer_id);
    if (existingAccount) {
      return NextResponse.json(
        { error: 'Billing account already exists for this customer' },
        { status: 409 }
      );
    }

    // Create billing account
    const billingAccount = await SetupService.createBillingAccount(
      stripe_customer_id,
      stripe_subscription_id
    );

    // Start environment provisioning
    const provisioning = await SetupService.startEnvironmentProvisioning(billingAccount.id);

    return NextResponse.json({
      billing_account: billingAccount,
      environment_provisioning: provisioning
    });

  } catch (error) {
    console.error('Setup initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate setup process' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const licenseKey = searchParams.get('license_key');
    const stripeCustomerId = searchParams.get('stripe_customer_id');

    if (!licenseKey && !stripeCustomerId) {
      return NextResponse.json(
        { error: 'License key or Stripe customer ID is required' },
        { status: 400 }
      );
    }

    let billingAccount;
    if (licenseKey) {
      billingAccount = await SetupService.getBillingAccountByLicenseKey(licenseKey);
    } else if (stripeCustomerId) {
      billingAccount = await SetupService.getBillingAccountByStripeCustomer(stripeCustomerId);
    }

    if (!billingAccount) {
      return NextResponse.json(
        { error: 'Billing account not found' },
        { status: 404 }
      );
    }

    // Get environment status
    const environmentStatus = await SetupService.getEnvironmentStatus(billingAccount.id);
    
    // Check admin setup status
    const adminSetupComplete = await SetupService.isAdminSetupComplete(billingAccount.id);

    return NextResponse.json({
      billing_account: billingAccount,
      environment_status: environmentStatus,
      admin_setup_complete: adminSetupComplete
    });

  } catch (error) {
    console.error('Setup status error:', error);
    return NextResponse.json(
      { error: 'Failed to get setup status' },
      { status: 500 }
    );
  }
}