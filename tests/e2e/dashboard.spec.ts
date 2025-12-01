import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for main dashboard elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
  
  test('should navigate between dashboard sections', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on vulnerability summary
    await page.click('text=Vulnerabilities');
    await expect(page).toHaveURL(/vulnerabilities/);
    
    // Navigate to endpoints
    await page.click('text=Endpoints');
    await expect(page).toHaveURL(/endpoints/);
  });
  
  test('should display vulnerability statistics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="vulnerability-summary"]', { timeout: 10000 });
    
    // Check for severity badges
    const criticalBadge = page.locator('text=/critical/i').first();
    await expect(criticalBadge).toBeVisible();
  });
});
