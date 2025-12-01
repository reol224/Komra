import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(key);
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

interface WelcomeEmailParams {
  customerEmail: string;
  username: string;
  tempPassword: string;
  licenseKey: string;
  loginUrl: string;
}

export class EmailService {
  private static getResendClient() {
    return getResend();
  }

  static async sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
    const { customerEmail, username, tempPassword, licenseKey, loginUrl } = params;

    // Validate required parameters
    if (!customerEmail || !username || !tempPassword || !licenseKey) {
      throw new Error('Missing required email parameters');
    }

    try {
      const { data, error } = await this.getResendClient().emails.send({
        from: 'onboarding@resend.dev', // Changed to Resend test domain
        to: customerEmail,
        subject: 'Welcome to Komra Security - Your Account Details',
        html: this.generateWelcomeEmailHTML({
          username,
          tempPassword,
          licenseKey,
          loginUrl: loginUrl || 'https://komrasec.com/login',
        }),
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      // Log email to database for audit trail
      await getSupabase().from('email_logs').insert({
        recipient: customerEmail,
        subject: 'Welcome to Komra Security - Your Admin Credentials',
        status: 'sent',
        provider: 'resend',
        provider_message_id: data?.id,
        sent_at: new Date().toISOString(),
      });

      console.log('Welcome email sent successfully via Resend:', data?.id);
    } catch (error: any) {
      // Log failed email attempt
      await getSupabase().from('email_logs').insert({
        recipient: customerEmail,
        subject: 'Welcome to Komra Security - Your Admin Credentials',
        status: 'failed',
        provider: 'resend',
        error_message: error.message,
        sent_at: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string): Promise<void> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">We received a request to reset your password for your Komra Security account.</p>
            
            <div style="margin: 30px 0;">
              <a href="${resetUrl}?token=${resetToken}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Reset Password</a>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>⚠️ Security Notice:</strong> This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Or copy and paste this link: ${resetUrl}?token=${resetToken}</p>
          </div>

          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Komra Security. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Password Reset Request

We received a request to reset your password for your Komra Security account.

Reset your password here: ${resetUrl}?token=${resetToken}

⚠️ SECURITY NOTICE: This link expires in 1 hour. If you didn't request this, please ignore this email.

© ${new Date().getFullYear()} Komra Security. All rights reserved.
    `;

    try {
      const { data, error } = await getResend().emails.send({
        from: 'Komra Security <security@komrasec.com>',
        to: email,
        subject: 'Reset Your Komra Security Password',
        html: htmlContent,
        text: textContent,
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      await getSupabase().from('email_logs').insert({
        recipient: email,
        subject: 'Reset Your Komra Security Password',
        status: 'sent',
        provider: 'resend',
        provider_message_id: data?.id,
        sent_at: new Date().toISOString(),
      });

      console.log('Password reset email sent via Resend:', data?.id);
    } catch (error: any) {
      await getSupabase().from('email_logs').insert({
        recipient: email,
        subject: 'Reset Your Komra Security Password',
        status: 'failed',
        provider: 'resend',
        error_message: error.message,
        sent_at: new Date().toISOString(),
      });

      throw error;
    }
  }

  private static generateWelcomeEmailHTML(params: {
    username: string;
    tempPassword: string;
    licenseKey: string;
    loginUrl: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Komra Security</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Komra Security</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your security audit platform is ready</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Thank you for choosing Komra! Your account has been successfully created.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #667eea; font-size: 18px;">Your Admin Credentials</h2>
              <p style="margin: 10px 0;"><strong>Username:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${params.username}</code></p>
              <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${params.tempPassword}</code></p>
              <p style="margin: 10px 0;"><strong>License Key:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${params.licenseKey}</code></p>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>⚠️ Security Notice:</strong> This is a temporary password. You will be required to change it and set up MFA on your first login.</p>
            </div>

            <div style="margin: 30px 0;">
              <a href="${params.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Login to Komra</a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <h3 style="color: #667eea; font-size: 16px;">Next Steps:</h3>
              <ol style="padding-left: 20px;">
                <li style="margin: 8px 0;">Log in using your credentials</li>
                <li style="margin: 8px 0;">Change your temporary password</li>
                <li style="margin: 8px 0;">Set up Multi-Factor Authentication (MFA)</li>
                <li style="margin: 8px 0;">Deploy your first agent to start monitoring</li>
              </ol>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 8px;">
              <h3 style="color: #667eea; font-size: 16px; margin-top: 0;">Need Help?</h3>
              <p style="margin: 10px 0;">Check out our documentation or contact support:</p>
              <p style="margin: 5px 0;">📧 Email: support@komrasec.com</p>
              <p style="margin: 5px 0;">📚 Docs: ${params.loginUrl}/docs</p>
            </div>
          </div>

          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Komra Security. All rights reserved.</p>
            <p style="margin: 5px 0;">This email contains sensitive information. Please keep it secure.</p>
          </div>
        </body>
      </html>
    `;
  }
}