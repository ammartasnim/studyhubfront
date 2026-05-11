import { test, expect } from '@playwright/test';
import { corsHeaders, mockClientUser } from '../../mocks/helpers';

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

    const postId = 201;
    const commentText = 'Great post!';

    await page.route('**/api/posts/feed*', async route => {
      if (route.request().method() === 'OPTIONS') { return route.fulfill({ status: 204, headers: corsHeaders() }); }
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
});