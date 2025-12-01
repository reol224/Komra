import { NextRequest, NextResponse } from 'next/server';
import { SetupService } from '@/lib/setupService';

export async function POST(request: Request) {
  try {
    const { billing_account_id, username, password, mfa_enabled, phone_number } = await request.json();

    // Validate required fields
    if (!billing_account_id || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: billing_account_id, username, password' },
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

    return NextResponse.json({
      admin_account: adminAccount,
      message: 'Admin account created successfully',
    });
  } catch (error: any) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create admin account' },
      { status: 500 }
    );
  }
}