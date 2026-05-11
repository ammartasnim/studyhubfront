import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, mockClientUser, mockMeAsClient, paginated } from '../../mocks/helpers';

test.describe('Client My Created Communities', () => {

  test('View my created communities page', async ({ page }) => {
    await mockMeAsClient(page);

    const myCommunity = { id: 100, title: 'My Own Community', description: 'I created this', category: 'Science', nbrMembers: 3, ownerId: 2 };

    // Mock my-created communities
    await page.route('**/api/communities/my-created*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([myCommunity])) });
    });

    await page.goto('/dashboard/client/my-created');
    await page.reload();

    await expect(page.getByText('My Created Communities')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('My Own Community')).toBeVisible({ timeout: 5000 });
  });

});
