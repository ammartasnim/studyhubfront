import { test, expect } from '@playwright/test';
import { corsHeaders } from '../../mocks/helpers';

test.describe('Registration', () => {

  test.use({ storageState: { cookies: [], origins: [] } });

  test('Register a new user (Happy Path)', async ({ page }) => {
    await page.route('**/api/auth/register', async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: corsHeaders() });
      }
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ token: 'new-user-jwt', user: { id: 3, email: 'new@user.com', role: 'Client' } })
      });
    });

    await page.route(/\/api\/clients\/me(\?|$)/, async route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 3, email: 'new@user.com', role: 'Client', username: 'newuser', firstName: 'New', lastName: 'User', banned: false, badges: [] }) });
    });

    await page.goto('/auth/register');

    await page.getByLabel('First Name').fill('New');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('User Name').fill('newuser');
    await page.getByPlaceholder('you@example.com').fill('new@user.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password', { exact: true }).fill('password123');

    // Accept terms and conditions
    await page.getByRole('checkbox', { name: /I agree/i }).check();

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });
});
