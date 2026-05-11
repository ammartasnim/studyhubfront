import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, mockClientUser, mockMeAsClient, paginated } from '../../mocks/helpers';

test.describe('Client Chat', () => {

  test('View chat page', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/my-friends*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(paginated([{ id: 100, username: 'testfriend', firstName: 'Test', lastName: 'Friend', fullName: 'Test Friend' }]))
      });
    });

    await page.goto('/dashboard/client/chat');
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Chats' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Test Friend')).toBeVisible();
  });

});
