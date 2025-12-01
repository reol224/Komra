import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });
  
  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', '123');
    await page.click('button:has-text("Sign In")');
    
    await expect(page.locator('text=/valid email/i')).toBeVisible();
  });
  
  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/');
    
    // Use demo credentials
    await page.fill('input[type="email"]', 'admin@komrasec.com');
    await page.fill('input[type="password"]', 'Admin123!@#');
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });
});
