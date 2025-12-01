import { test, expect } from '@playwright/test';

test.describe('Stripe Checkout Email Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Clear any existing sessions
    await page.goto('/');
  });

  test('should display email confirmation after successful checkout', async ({ page }) => {
    // This test simulates the post-checkout flow
    // In a real scenario, you'd complete a Stripe checkout first
    
    // Navigate to a success page (you may need to create this)
    await page.goto('/checkout/success?session_id=test_session');
    
    // Should show success message
    await expect(page.locator('text=/check your email/i')).toBeVisible();
    await expect(page.locator('text=/welcome email/i')).toBeVisible();
  });

  test('should show email instructions on setup page', async ({ page }) => {
    await page.goto('/setup');
    
    // Should mention email delivery
    await expect(page.locator('text=/credentials.*email/i')).toBeVisible();
  });
});

test.describe('Email Service Integration', () => {
  test('should handle email delivery status', async ({ page, context }) => {
    // Mock API response for email status
    await context.route('**/api/email/status', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          status: 'sent',
          messageId: 'test-123',
          recipient: 'test@example.com',
        }),
      });
    });

    await page.goto('/admin/email-logs');
    
    // Should display email logs
    await expect(page.locator('text=/sent/i')).toBeVisible();
  });
});

test.describe('Welcome Email Content', () => {
  test('should display all required information in email preview', async ({ page }) => {
    // If you have an email preview page for testing
    await page.goto('/admin/email-preview/welcome');
    
    // Check for required elements
    await expect(page.locator('text=/username/i')).toBeVisible();
    await expect(page.locator('text=/temporary password/i')).toBeVisible();
    await expect(page.locator('text=/license key/i')).toBeVisible();
    await expect(page.locator('text=/security notice/i')).toBeVisible();
    await expect(page.locator('text=/MFA/i')).toBeVisible();
  });
});
