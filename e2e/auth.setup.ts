import { test as setup, expect } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.resolve(__dirname, '../.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/auth/login');

  await page.route('**/api/auth/login', async route => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': '*' } });
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'setup-jwt-token',
        user: { id: 1, email: 'admin@studyhub.com', role: 'Admin' }
      })
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
        username: 'admin', firstName: 'Admin', lastName: 'User',
        banned: false, badges: []
      })
    });
  });

  await page.getByPlaceholder('you@example.com').fill('admin@studyhub.com');
  await page.getByPlaceholder('••••••••').fill('password123');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.context().storageState({ path: AUTH_FILE });
});
