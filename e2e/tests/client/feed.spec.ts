import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, mockClientUser, mockMeAsClient } from '../../mocks/helpers';

test.describe('Client Feed', () => {

  test('Create a Post (Happy Path)', async ({ page }) => {
    // Mock /api/clients/me to return Client role — storageState has Admin, but we need Client for feed page
    await page.route(/\/api\/clients\/me(\?|$)/, async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: corsHeaders() });
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockClientUser()) });
    });

    await page.goto('/dashboard/client/feed');

    // Mock feed load
    await page.route('**/api/posts/feed*', async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': '*' } });
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            { id: 101, title: 'My New Post', content: 'Hello, this is my new e2e test post!', likeCount: 0, commentCount: 0, createdAt: new Date().toISOString(), userFirstName: 'Client', userLastName: 'User', userUsername: 'clientuser', status: 'Approved', liked: false, imgs: [], userId: 2 }
          ],
          totalElements: 1, totalPages: 1, number: 0, size: 10
        })
      });
    });

    // Mock post creation
    await page.route('**/api/posts', async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': '*' } });
      }
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201, contentType: 'application/json',
          body: JSON.stringify({ id: 101, title: 'My New Post', content: 'Hello, this is my new e2e test post!', likeCount: 0, commentCount: 0, createdAt: new Date().toISOString(), userFirstName: 'Client', userLastName: 'User', userUsername: 'clientuser', status: 'Approved', liked: false, imgs: [], userId: 2 })
        });
      }
      return route.fallback();
    });

    // Mock blocked users endpoint
    await page.route('**/api/friendships/blocked*', async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }) });
    });

    await page.reload();

    // Open Create Post modal
    await page.getByRole('button', { name: 'New Post' }).first().click();

    // Fill form
    await page.getByPlaceholder('Give your post a title...').fill('My New Post');
    await page.getByPlaceholder('Write your post content...').fill('Hello, this is my new e2e test post!');

    // Submit
    await page.getByRole('button', { name: /Create Post/i }).click();

    // Verify post appears
    await expect(page.getByText('Hello, this is my new e2e test post!')).toBeVisible({ timeout: 10000 });
  });

  test('Like a post (Happy Path)', async ({ page }) => {
    await page.route(/\/api\/clients\/me(\?|$)/, async route => {
      if (route.request().method() === 'OPTIONS') { return route.fulfill({ status: 204, headers: corsHeaders() }); }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockClientUser()) });
    });

    await page.goto('/dashboard/client/feed');

    await page.route('**/api/friendships/blocked*', async route => {
      if (route.request().method() === 'OPTIONS') { return route.fulfill({ status: 204, headers: corsHeaders() }); }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    await page.route('**/api/communities/my*', async route => {
      if (route.request().method() === 'OPTIONS') { return route.fulfill({ status: 204, headers: corsHeaders() }); }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    const postId = 101;
    await page.route('**/api/posts/feed*', async route => {
      if (route.request().method() === 'OPTIONS') { return route.fulfill({ status: 204, headers: corsHeaders() }); }
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          content: [{ id: postId, title: 'Like Test Post', content: 'Testing likes', likeCount: 5, commentCount: 3, createdAt: new Date().toISOString(), authorId: 2, authorFullName: 'Client User', authorUsername: 'clientuser', status: 'Approved', liked: false, imgs: [], userId: 2 }],
          totalElements: 1, totalPages: 1, number: 0, size: 10
        })
      });
    });

    // Mock toggle like endpoint
    await page.route(/\/api\/posts\/\d+\/like/, async route => {
      if (route.request().method() === 'OPTIONS') { return route.fulfill({ status: 204, headers: corsHeaders() }); }
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'ok' });
    });

    await page.reload();

    // Like button shows count "5" — click it
    const likeBtn = page.locator('article').filter({ hasText: 'Like Test Post' }).getByRole('button', { name: '5', exact: true });
    await expect(likeBtn).toBeVisible({ timeout: 5000 });
    await likeBtn.click();

    // After toggling, optimistic update changes count to 6
    await expect(page.locator('article').filter({ hasText: 'Like Test Post' }).getByRole('button', { name: '6', exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('Comment on a post (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    await page.goto('/dashboard/client/feed');

    await page.route('**/api/friendships/blocked*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    await page.route('**/api/communities/my*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    const postId = 201;
    const commentText = 'Great post!';

    await page.route('**/api/posts/feed*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          content: [{ id: postId, title: 'Comment Test', content: 'Testing comments', likeCount: 0, commentCount: 3, createdAt: new Date().toISOString(), authorId: 2, authorFullName: 'Client User', authorUsername: 'clientuser', status: 'Approved', liked: false, imgs: [], userId: 2 }],
          totalElements: 1, totalPages: 1, number: 0, size: 10
        })
      });
    });

    // Mock GET comments (empty on first load)
    await page.route(/\/api\/posts\/\d+\/comments/, async route => {
      const method = route.request().method();
      if (method === 'OPTIONS') { return route.fulfill({ status: 204, headers: corsHeaders() }); }
      if (method === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 5 })
        });
      }
      if (method === 'POST') {
        return route.fulfill({
          status: 201, contentType: 'application/json',
          body: JSON.stringify({
            id: 301, content: commentText, postId, userId: 2,
            authorFirstName: 'Client', authorLastName: 'User', authorUsername: 'clientuser',
            createdAt: new Date().toISOString(), likeCount: 0, isLiked: false
          })
        });
      }
      return route.fallback();
    });

    await page.reload();

    // Click comment button (shows count "3")
    const commentBtn = page.locator('article').filter({ hasText: 'Comment Test' }).getByRole('button', { name: '3', exact: true });
    await expect(commentBtn).toBeVisible({ timeout: 5000 });
    await commentBtn.click();

    // Fill comment input and post — use textarea specifically to avoid custom component wrapper
    await page.locator('textarea[placeholder="Write a comment..."]').fill(commentText);
    await page.getByRole('button', { name: 'Post', exact: true }).click();

    // Verify comment appears
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 5000 });
  });

  test('Reply to a comment (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    await page.goto('/dashboard/client/feed');

    await page.route('**/api/friendships/blocked*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    await page.route('**/api/communities/my*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    const postId = 201;
    const commentId = 301;
    const replyContent = 'I agree with this!';

    await page.route('**/api/posts/feed*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          content: [{ id: postId, title: 'Reply Test Post', content: 'Testing replies', likeCount: 2, commentCount: 1, createdAt: new Date().toISOString(), authorId: 3, authorFullName: 'Other User', authorUsername: 'otheruser', status: 'Approved', liked: false, imgs: [], userId: 3 }],
          totalElements: 1, totalPages: 1, number: 0, size: 10
        })
      });
    });

    // Mock GET comments (one comment that can be replied to)
    // Must use Spring-style pagination format (content/totalElements), not facade format
    await page.route(/\/api\/posts\/\d+\/comments/, async route => {
      const method = route.request().method();
      if (method === 'OPTIONS') { return route.fulfill({ status: 204, headers: corsHeaders() }); }
      if (method === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            content: [{ id: commentId, content: 'Nice post!', postId, userId: 3, authorFullName: 'Other User', authorUsername: 'otheruser', createdAt: new Date().toISOString(), likeCount: 0, isLiked: false }],
            totalElements: 1, totalPages: 1, size: 5, number: 0
          })
        });
      }
      return route.fallback();
    });

    // Mock GET replies (empty)
    await page.route(/\/api\/comments\/\d+\/replies/, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], totalItems: 0 }) });
    });

    // Mock POST reply
    await page.route(/\/api\/comments\/\d+\/reply/, async route => {
      if (await handleOptions(route)) return;
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({
          id: 401, content: replyContent, postId, userId: 2,
          authorFullName: 'Client User', createdAt: new Date().toISOString(), likeCount: 0, isLiked: false
        })});
      }
      return route.fallback();
    });

    await page.reload();

    // Click comment button (shows count "1")
    const commentBtn = page.locator('article').filter({ hasText: 'Reply Test Post' }).getByRole('button', { name: '1', exact: true });
    await expect(commentBtn).toBeVisible({ timeout: 5000 });
    await commentBtn.click();

    // Wait for the comment to appear
    await expect(page.getByText('Nice post!')).toBeVisible({ timeout: 5000 });

    // Click "View replies" to expand the reply form
    await page.getByRole('button', { name: 'View replies' }).click();

    // Fill the reply textarea and submit
    // Use textarea directly (not the custom app-mention-input wrapper)
    await page.locator('textarea[placeholder="Write a reply..."]').fill(replyContent);
    await page.getByRole('button', { name: 'Send' }).click();

    // Verify the reply appears
    await expect(page.getByText(replyContent)).toBeVisible({ timeout: 5000 });
  });
});