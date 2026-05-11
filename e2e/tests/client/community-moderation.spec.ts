import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, mockClientUser, mockMeAsClient, paginated } from '../../mocks/helpers';

test.describe('Client Community Moderation', () => {

  test('Approve a pending post in community', async ({ page }) => {
    await mockMeAsClient(page);

    const communityId = 100;
    const approvedPostId = 201;
    const pendingPostId = 301;

    const community = {
      id: communityId,
      title: 'My Community',
      description: 'A community I own',
      category: 'Programming',
      nbrMembers: 1,
      ownerId: 2,
      moderators: [],
    };

    const approvedPost = {
      id: approvedPostId,
      title: 'Approved Post',
      content: 'This post is already approved',
      status: 'Approved',
      authorId: 2,
      authorFullName: 'Client User',
      likeCount: 1,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      liked: false,
      imgs: [],
    };

    const pendingPost = {
      id: pendingPostId,
      title: 'Pending Post',
      content: 'Please approve me',
      status: 'Pending',
      authorId: 3,
      authorFullName: 'Other User',
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      liked: false,
      imgs: [],
    };

    // Mock community detail
    await page.route(`**/api/communities/${communityId}`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(community) });
    });

    // Mock my-communities check (user IS a member)
    await page.route('**/api/communities/my*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([community])) });
    });

    // Mock community posts (general feed)
    await page.route(`**/api/posts/community/${communityId}*`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([approvedPost])) });
    });

    // Mock member preview
    await page.route(`**/api/communities/${communityId}/members/preview`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Mock pending posts endpoint
    await page.route(`**/api/posts/community/${communityId}/pending*`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([pendingPost]) });
    });

    // Mock approve endpoint
    await page.route(`**/api/posts/${pendingPostId}/approve`, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'ok' });
    });

    await page.goto(`/dashboard/client/community/${communityId}`);
    await page.reload();

    // Click Pending button/tab
    const pendingTab = page.getByRole('button', { name: 'Pending' }).first();
    await expect(pendingTab).toBeVisible({ timeout: 5000 });
    await pendingTab.click();

    // Wait for pending posts to load
    await expect(page.getByText('Please approve me')).toBeVisible({ timeout: 5000 });

    // Click Approve button on the pending post card
    await page.getByRole('button', { name: /Approve/i }).click();

    // Verify post is removed from pending list
    await expect(page.getByText('No pending posts')).toBeVisible({ timeout: 5000 });
  });
});
