import { test, expect } from '@playwright/test';
import { AdminUsersPage } from '../../fixtures/admin-users-page';
import { corsHeaders, paginated } from '../../mocks/helpers';

test.describe('Admin User Management', () => {

  test('Ban a User (Happy Path)', async ({ page }) => {
    const adminPage = new AdminUsersPage(page);
    let isBanned = false;

    await page.route(/\/api\/clients/, async route => {
      const url = route.request().url();
      const method = route.request().method();
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      if (url.includes('/ban')) { isBanned = true; return route.fulfill({ status: 200, body: 'ok', headers: { 'Content-Type': 'text/plain', ...corsHeaders() } }); }
      if (url.endsWith('/clients/me')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin@studyhub.com', role: 'Admin', username: 'admin', firstName: 'Admin', lastName: 'User', banned: false, badges: [] }) });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([{ id: 999, firstName: 'Test', lastName: 'User', email: 'test@user.com', username: 'testuser', banned: isBanned, role: 'Client', badges: [] }])) });
    });

    await adminPage.goto();
    await page.reload();
    await adminPage.waitForTable();
    await adminPage.clickBan();
    await adminPage.confirmBan();
    await adminPage.assertBanned('test@user.com');
  });

  test('Unban a User (Happy Path)', async ({ page }) => {
    let isBanned = true;

    await page.route(/\/api\/clients/, async route => {
      const url = route.request().url();
      const method = route.request().method();
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      if (url.includes('/unban')) { isBanned = false; return route.fulfill({ status: 200, body: 'ok', headers: { 'Content-Type': 'text/plain', ...corsHeaders() } }); }
      if (url.endsWith('/clients/me')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin@studyhub.com', role: 'Admin', username: 'admin', banned: false, badges: [] }) });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([{ id: 999, firstName: 'Test', lastName: 'User', email: 'test@user.com', role: 'Client', banned: isBanned, badges: [] }])) });
    });

    await page.goto('/dashboard/admin/users');
    await page.reload();
    await expect(page.getByText('test@user.com').first()).toBeVisible();

    // Click Unban directly (no modal for unban)
    await page.getByRole('button', { name: 'Unban' }).first().click();
    await expect(page.getByRole('button', { name: 'Ban', exact: true }).first()).toBeVisible({ timeout: 10000 });
  });

  test('Search filters users by first name', async ({ page }) => {
    await page.route(/\/api\/clients/, async route => {
      const url = route.request().url();
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      if (url.endsWith('/clients/me')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin@studyhub.com', role: 'Admin', banned: false }) });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([{ id: 1, firstName: 'SearchResult', lastName: 'User', email: 'found@test.com', role: 'Client', banned: false, badges: [] }])) });
    });

    await page.goto('/dashboard/admin/users');
    await page.reload();

    await page.getByPlaceholder('Search by first name...').fill('SearchResult');
    await page.waitForTimeout(600);

    await expect(page.getByText('found@test.com')).toBeVisible();
  });

  test('Status tabs filter Active vs Banned', async ({ page }) => {
    let bannedFilter: boolean | undefined;

    await page.route(/\/api\/clients/, async route => {
      const url = route.request().url();
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      if (url.endsWith('/clients/me')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin@studyhub.com', role: 'Admin' }) });

      // Capture the banned query param
      const urlObj = new URL(url);
      const bannedParam = urlObj.searchParams.get('banned');
      bannedFilter = bannedParam === 'true' ? true : bannedParam === 'false' ? false : undefined;

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([{ id: 999, firstName: 'FilterTest', email: 'filter@test.com', role: 'Client', banned: false, badges: [] }])) });
    });

    await page.goto('/dashboard/admin/users');
    await page.reload();

    // Click "Banned" tab
    await page.getByRole('button', { name: 'Banned' }).click();
    await page.waitForTimeout(300);
    expect(bannedFilter).toBe(true);

    // Click "Active" tab
    await page.getByRole('button', { name: 'Active' }).click();
    await page.waitForTimeout(300);
    expect(bannedFilter).toBe(false);
  });
});


