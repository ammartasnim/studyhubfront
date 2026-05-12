import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {

  test.use({ storageState: { cookies: [], origins: [] } });

  test('Valid Login (Happy Path)', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': '*' } });
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'fake-jwt-token-123',
          user: { id: 1, email: 'admin@studyhub.com', role: 'Admin' }
        }),
      });
    });

    await page.route(/\/api\/clients\/me(\?|$)/, async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1, email: 'admin@studyhub.com', role: 'Admin',
          username: 'admin_user', firstName: 'Admin', lastName: 'User',
          banned: false, badges: []
        }),
      });
    });

    await page.goto('/auth/login');

    await page.getByPlaceholder('you@example.com').fill('admin@studyhub.com');
    await page.getByPlaceholder('••••••••').fill('password123');

    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('Invalid Login (Error Path)', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        });
        return;
      }
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Login failed. Please check your credentials and try again.'
        }),
      });
    });

    await page.goto('/auth/login');

    await page.getByPlaceholder('you@example.com').fill('admin@studyhub.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');

    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await expect(page).toHaveURL(/\/auth\/login/);

    const errorMessage = page.locator('text=Login failed').or(page.locator('text=Cannot connect'));
    await expect(errorMessage.first()).toBeVisible();
  });
});