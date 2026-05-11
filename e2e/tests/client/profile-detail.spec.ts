import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, mockClientUser, mockMeAsClient, paginated } from '../../mocks/helpers';

test('View another user\'s profile', async ({ page }) => {
  await mockMeAsClient(page);

  await page.route('**/api/clients/42', async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        id: 42, email: 'other@studyhub.com', role: 'Client',
        username: 'otheruser', firstName: 'Other', lastName: 'User',
        banned: false, badges: [], phone: '', xpPts: 0, level: 1, pfp: null,
      })
    });
  });

  await page.route('**/api/posts/user/42*', async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
  });

  await page.route('**/api/friendships/is-friend/42', async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(false) });
  });

  await page.route('**/api/friendships/sent*', async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
  });

  await page.route('**/api/friendships/blocked*', async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
  });

  await page.route('**/api/communities/user/42', async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [] }) });
  });

  await page.goto('/dashboard/client/profile/42');
  await page.reload();

  await expect(page.getByText('Other User').first()).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Add Friend' })).toBeVisible({ timeout: 5000 });
});
