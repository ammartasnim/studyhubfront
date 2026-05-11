import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, mockClientUser, mockMeAsClient, paginated } from '../../mocks/helpers';

test.describe('Client Explore Communities', () => {

  test('View explore communities page', async ({ page }) => {
    await mockMeAsClient(page);

    const testCommunity = { id: 100, title: 'Test Community', description: 'A community for testing', category: 'Programming', nbrMembers: 10 };

    // Mock communities list
    await page.route('**/api/communities*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([testCommunity])) });
    });

    await page.goto('/dashboard/client/explore');
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Explore Communities' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Test Community')).toBeVisible({ timeout: 5000 });
  });
});
