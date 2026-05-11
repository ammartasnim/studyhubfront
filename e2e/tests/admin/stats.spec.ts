import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, paginated } from '../../mocks/helpers';

test('View admin stats dashboard', async ({ page }) => {
  await page.route(/\/api\/clients\/me(\?|$)/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin@studyhub.com', role: 'Admin', username: 'admin' }) });
  });

  await page.route(/\/api\/clients\/stats\/count/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total: 150, banned: 5 }) });
  });

  await page.route(/\/api\/posts\/stats\/count/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total: 300, flagged: 12, pending: 3 }) });
  });

  await page.route(/\/api\/comments\/stats\/count/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total: 800 }) });
  });

  await page.route(/\/api\/communities\/stats\/count/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total: 25 }) });
  });

  await page.route(/\/api\/focus-sessions\/stats\/count/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ completed: 1200, active: 8 }) });
  });

  await page.route(/\/api\/clients\/stats\/badges/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ BEGINNER: 50, LEARNER: 30, EXPLORER: 20 }) });
  });

  await page.route(/\/api\/focus-sessions\/stats\/top-users/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ userId: 1, username: 'topuser', totalHours: 42.5 }]) });
  });

  await page.route(/\/api\/clients\/stats\/growth/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ date: '2026-01-01', count: 5 }, { date: '2026-01-02', count: 3 }]) });
  });

  await page.route(/\/api\/focus-sessions\/stats\/trends/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ date: '2026-01-01', count: 10 }, { date: '2026-01-02', count: 15 }]) });
  });

  await page.goto('/dashboard/admin/stats');
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Total Users')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Total Posts')).toBeVisible({ timeout: 5000 });
});
