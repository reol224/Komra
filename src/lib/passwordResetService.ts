import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface PasswordResetResult {
  success: boolean;
  message: string;
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
      return {
        success: false,
        message: 'Failed to process password reset request.',
      };
    }

    // In production, send email with reset link
    // For now, log the reset token (REMOVE IN PRODUCTION)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`);

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
export async function resetPassword(token: string, newPassword: string): Promise<PasswordResetResult> {
  try {
    // Verify token
    const { valid, userId } = await verifyResetToken(token);
    if (!valid || !userId) {
      return {
        success: false,
        message: 'Invalid or expired reset token.',
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
      return {
        success: false,
        message: 'Failed to reset password.',
      };
    }

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
  adminUserId: string
): Promise<PasswordResetResult> {
  try {
    // Verify admin has permission
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminUserId)
      .single();

    if (adminError || admin?.role !== 'admin') {
      return {
        success: false,
        message: 'Unauthorized: Admin access required.',
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
      return {
        success: false,
        message: 'Failed to reset password.',
      };
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: adminUserId,
      action: 'admin_password_reset',
      resource_type: 'user',
      resource_id: userId,
      details: { target_user_id: userId },
    });

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
