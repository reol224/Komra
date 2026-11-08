import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { validatePassword, PasswordValidationContext, PasswordValidationResult } from '@/lib/passwordValidation';
import { auditLogger } from '@/lib/auditLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'unknown';
  return `${name.slice(0, 1)}***@${domain}`;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  validationResult?: PasswordValidationResult;
}

/**
 * Request a password reset for a user
 * Generates a reset token and stores it in the database
 */
export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      await auditLogger.log(
        'PASSWORD_RESET_REQUESTED',
        'authentication',
        { account_email: maskEmail(email) },
        { severity: 'medium', metadata: { action_category: 'authentication', security_relevant: true } },
      );
      // Don't reveal if user exists for security
      return {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      };
    }

    // Generate reset token (in production, use crypto.randomBytes)
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error storing reset token:', updateError);
      await auditLogger.log(
        'PASSWORD_RESET_REQUEST_FAILED',
        'authentication',
        { account_email: maskEmail(email), error_code: updateError.code },
        { severity: 'high', status: 'failure', metadata: { action_category: 'authentication', security_relevant: true } },
      );
      return {
        success: false,
        message: 'Failed to process password reset request.',
      };
    }

    await auditLogger.log(
      'PASSWORD_RESET_REQUESTED',
      'authentication',
      { target_user_id: user.id, account_email: maskEmail(email) },
      { resourceId: user.id, severity: 'medium', metadata: { action_category: 'authentication', security_relevant: true } },
    );

    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      message: 'An error occurred while processing your request.',
    };
  }
}

/**
 * Verify if a reset token is valid
 */
export async function verifyResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, reset_token, reset_token_expiry')
      .eq('reset_token', token)
      .single();

    if (error || !user) {
      return { valid: false };
    }

    // Check if token is expired
    const expiryDate = new Date(user.reset_token_expiry);
    if (expiryDate < new Date()) {
      return { valid: false };
    }

    return { valid: true, userId: user.id };
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false };
  }
}

/**
 * Reset password using a valid token
 */
export async function resetPassword(
  token: string, 
  newPassword: string,
  context?: PasswordValidationContext
): Promise<PasswordResetResult> {
  try {
    // Verify token
    const { valid, userId } = await verifyResetToken(token);
    if (!valid || !userId) {
      await auditLogger.log(
        'PASSWORD_RESET_FAILED',
        'authentication',
        { reason: 'invalid_or_expired_token' },
        { severity: 'high', status: 'failure', metadata: { action_category: 'authentication', security_relevant: true } },
      );
      return {
        success: false,
        message: 'Invalid or expired reset token.',
      };
    }

    // Validate password strength
    const validationResult = await validatePassword(newPassword, context);
    if (!validationResult.isValid) {
      await auditLogger.log(
        'PASSWORD_RESET_FAILED',
        'authentication',
        { target_user_id: userId, reason: 'password_policy_rejected' },
        { resourceId: userId, severity: 'medium', status: 'failure', metadata: { action_category: 'authentication', security_relevant: true } },
      );
      const errorMessages = validationResult.errors
        .filter(e => e.severity === 'error')
        .map(e => e.message)
        .join('. ');
      return {
        success: false,
        message: errorMessages || 'Password does not meet security requirements.',
        validationResult,
      };
    }

    // Hash the new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating password:', updateError);
      await auditLogger.log(
        'PASSWORD_RESET_FAILED',
        'authentication',
        { target_user_id: userId, error_code: updateError.code },
        { resourceId: userId, severity: 'high', status: 'failure', metadata: { action_category: 'authentication', security_relevant: true } },
      );
      return {
        success: false,
        message: 'Failed to reset password.',
      };
    }

    await auditLogger.log(
      'PASSWORD_RESET_COMPLETED',
      'user',
      { target_user_id: userId },
      { resourceId: userId, severity: 'high', metadata: { action_category: 'authentication', security_relevant: true, compliance_relevant: true } },
    );
    return {
      success: true,
      message: 'Password has been reset successfully.',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: 'An error occurred while resetting your password.',
    };
  }
}

/**
 * Admin function to reset a user's password directly
 */
export async function adminResetUserPassword(
  userId: string,
  newPassword: string,
  adminUserId: string,
  context?: PasswordValidationContext
): Promise<PasswordResetResult> {
  try {
    // Verify admin has permission
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', adminUserId)
      .single();

    if (adminError || admin?.role !== 'admin') {
      await auditLogger.log(
        'ADMIN_PASSWORD_RESET_DENIED',
        'user',
        { target_user_id: userId, admin_user_id: adminUserId },
        { resourceId: userId, severity: 'critical', status: 'failure', metadata: { action_category: 'user_administration', security_relevant: true } },
      );
      return {
        success: false,
        message: 'Unauthorized: Admin access required.',
      };
    }

    // Validate password strength
    const validationResult = await validatePassword(newPassword, context);
    if (!validationResult.isValid) {
      await auditLogger.log(
        'ADMIN_PASSWORD_RESET_FAILED',
        'user',
        { target_user_id: userId, reason: 'password_policy_rejected' },
        { resourceId: userId, severity: 'high', status: 'failure', metadata: { action_category: 'user_administration', security_relevant: true } },
      );
      const errorMessages = validationResult.errors
        .filter(e => e.severity === 'error')
        .map(e => e.message)
        .join('. ');
      return {
        success: false,
        message: errorMessages || 'Password does not meet security requirements.',
        validationResult,
      };
    }

    // Hash the new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating password:', updateError);
      await auditLogger.log(
        'ADMIN_PASSWORD_RESET_FAILED',
        'user',
        { target_user_id: userId, error_code: updateError.code },
        { resourceId: userId, severity: 'critical', status: 'failure', metadata: { action_category: 'user_administration', security_relevant: true } },
      );
      return {
        success: false,
        message: 'Failed to reset password.',
      };
    }

    await auditLogger.log(
      'ADMIN_PASSWORD_RESET',
      'user',
      { target_user_id: userId, admin_user_id: adminUserId },
      {
        resourceId: userId,
        severity: 'critical',
        metadata: { action_category: 'user_administration', security_relevant: true, compliance_relevant: true },
        actorUserId: adminUserId,
        actorUserEmail: admin.email,
      },
    );

    return {
      success: true,
      message: 'Password has been reset successfully.',
    };
  } catch (error) {
    console.error('Admin password reset error:', error);
    return {
      success: false,
      message: 'An error occurred while resetting the password.',
    };
  }
}
