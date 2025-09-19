import { NextRequest, NextResponse } from 'next/server';
import { SetupService } from '@/lib/setupService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      billing_account_id, 
      username, 
      password, 
      mfa_enabled = false, 
      phone_number 
    } = body;

    // Validate required fields
    if (!billing_account_id || !username || !password) {
      return NextResponse.json(
        { error: 'Billing account ID, username, and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if admin setup already exists
    const existingSetup = await SetupService.isAdminSetupComplete(billing_account_id);
    if (existingSetup) {
      return NextResponse.json(
        { error: 'Admin account already exists for this billing account' },
        { status: 409 }
      );
    }

    // Create admin account
    const adminAccount = await SetupService.createAdminAccount(
      billing_account_id,
      username,
      password,
      mfa_enabled,
      phone_number
    );

    // Remove sensitive data from response
    const { password_hash, mfa_secret, ...safeAdminData } = adminAccount;

    return NextResponse.json({
      admin_account: safeAdminData,
      message: 'Admin account created successfully'
    });

  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin account' },
      { status: 500 }
    );
  }
}