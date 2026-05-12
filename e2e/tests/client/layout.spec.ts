import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, mockClientUser, mockMeAsClient } from '../../mocks/helpers';

test.describe('Dashboard Layout', () => {

  test('Dashboard sidebar navigation shows links', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/blocked*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    await page.goto('/dashboard/client/feed');
    await page.reload();

    await expect(page.getByRole('button', { name: 'Feed' })).toBeVisible({ timeout: 5000 });
  });

  test('Focus timer widget is visible in sidebar', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/blocked*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    await page.route('**/api/focus-sessions/active', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
    });

    await page.route('**/api/focus-sessions/user/*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/dashboard/client/feed');
    await page.reload();

    await expect(page.getByText('Focus timer')).toBeVisible({ timeout: 5000 });
  });

  test('AI assistant is visible in sidebar', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/blocked*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    await page.goto('/dashboard/client/feed');
    await page.reload();

    await expect(page.getByText('AI Assistant')).toBeVisible({ timeout: 5000 });
  });

  test('User badges and XP card render on feed page', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/blocked*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    await page.route('**/api/posts/feed*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    await page.route('**/api/communities/my*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    await page.goto('/dashboard/client/feed');
    await page.reload();

    await expect(page.getByText('Level 3')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('150 XP')).toBeVisible({ timeout: 5000 });
  });
});
