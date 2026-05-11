import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, mockClientUser, mockMeAsClient, paginated } from '../../mocks/helpers';

test.describe('Client Communities', () => {

  test('Create a community (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    const createdCommunity = { id: 100, title: 'Test Community', description: 'A community for testing', category: 'Programming', nbrMembers: 1, ownerId: 2 };

    // Mock my-created communities list (GET /api/communities/my)
    await page.route('**/api/communities/my*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([createdCommunity])) });
    });

    // Mock community creation (POST /api/communities)
    await page.route('**/api/communities', async route => {
      if (await handleOptions(route)) return;
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, contentType: 'application/json', headers: corsHeaders(), body: JSON.stringify(createdCommunity) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([createdCommunity])) });
    });

    // Mock AI improve to avoid hanging
    await page.route('**/api/ai/improve-description', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'text/plain', body: 'Improved description' });
    });

    await page.goto('/dashboard/client/my-created');
    await page.reload();

    // Click New Community button
    await page.getByRole('button', { name: 'New Community' }).click();

    // Fill form
    await page.getByPlaceholder('e.g., Web Development, Data Science...').fill('Test Community');
    await page.getByPlaceholder('Describe what this community is about...').fill('A community for testing');

    // Select category
    await page.getByRole('combobox').filter({ hasText: 'Select a category' }).selectOption('Programming');

    // Submit
    await page.getByRole('button', { name: 'Create Community' }).click();

    // Wait for modal to close and verify community appears in the list
    await expect(page.getByText('Test Community')).toBeVisible({ timeout: 5000 });
  });

  test('Join a community (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    const communityId = 200;
    const community = { id: communityId, title: 'Joinable Community', description: 'You can join this', category: 'Science', nbrMembers: 10, ownerId: 99 };

    // Mock community detail
    await page.route(`**/api/communities/${communityId}`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(community) });
    });

    // Mock my-communities check (user is NOT a member)
    await page.route('**/api/communities/my*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });

    // Mock community posts
    await page.route(`**/api/posts/community/${communityId}*`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });

    // Mock member preview
    await page.route(`**/api/communities/${communityId}/members/preview`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Mock join endpoint
    await page.route(`**/api/communities/${communityId}/join`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'Joined' });
    });

    await page.goto(`/dashboard/client/community/${communityId}`);
    await page.reload();

    // Click Join Community
    const joinBtn = page.getByRole('button', { name: 'Join Community' });
    await expect(joinBtn).toBeVisible({ timeout: 5000 });
    await joinBtn.click();

    // Verify button changes to Leave Community
    await expect(page.getByRole('button', { name: 'Leave Community' })).toBeVisible({ timeout: 5000 });
  });

  test('Leave a community (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    const communityId = 300;
    const community = { id: communityId, title: 'Leavable Community', description: 'You can leave this', category: 'Design', nbrMembers: 5, ownerId: 99 };

    // Mock community detail
    await page.route(`**/api/communities/${communityId}`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(community) });
    });

    // Mock my-communities check (user IS a member)
    await page.route('**/api/communities/my*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(paginated([{ id: communityId, title: 'Leavable Community' }]))
      });
    });

    // Mock community posts
    await page.route(`**/api/posts/community/${communityId}*`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });

    // Mock member preview
    await page.route(`**/api/communities/${communityId}/members/preview`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Mock leave endpoint
    await page.route(`**/api/communities/${communityId}/leave`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'Left' });
    });

    await page.goto(`/dashboard/client/community/${communityId}`);
    await page.reload();

    // Click Leave Community
    const leaveBtn = page.getByRole('button', { name: 'Leave Community' });
    await expect(leaveBtn).toBeVisible({ timeout: 5000 });
    await leaveBtn.click();

    // Verify button changes to Join Community
    await expect(page.getByRole('button', { name: 'Join Community' })).toBeVisible({ timeout: 5000 });
  });
});
