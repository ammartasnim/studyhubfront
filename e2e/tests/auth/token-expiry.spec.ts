import { test, expect } from '@playwright/test';
import { corsHeaders } from '../../mocks/helpers';

test.describe('Token Expiry', () => {

  test.use({ storageState: { cookies: [], origins: [] } });

  test('Expired token redirects to login when accessing protected route', async ({ page }) => {
    // Simulate having a stored token
    await page.goto('/auth/login');
    await page.evaluate(() => localStorage.setItem('token', 'expired-jwt'));

    // Mock /me to return 401 (token expired)
    await page.route(/\/api\/clients\/me(\?|$)/, async route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      await route.fulfill({ status: 401 });
    });

    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
