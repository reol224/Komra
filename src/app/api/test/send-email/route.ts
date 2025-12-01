import { NextResponse } from 'next/server';
import { EmailService } from '@/lib/emailService';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Send test welcome email
    await EmailService.sendWelcomeEmail({
      customerEmail: email,
      username: 'testuser',
      tempPassword: 'TempPass123!',
      licenseKey: 'lic-test-' + Date.now(),
      loginUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://komrasec.com',
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}
