import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, mockClientUser, mockMeAsClient, paginated } from '../../mocks/helpers';

test.describe('Client Profile & Settings', () => {

  test('View profile (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/posts/me*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(paginated([{
          id: 301, title: 'My Post', content: 'This is my post', likeCount: 2, commentCount: 1,
          createdAt: new Date().toISOString(), authorId: 2, authorFullName: 'Client User',
          authorUsername: 'clientuser', status: 'Approved', liked: false, imgs: [], userId: 2
        }]))
      });
    });

    await page.route('**/api/friendships/my-friends*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    await page.goto('/dashboard/client/profile');
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Client User' }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('My Post').first()).toBeVisible();
  });

  test('Edit a post from profile (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/posts/me*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(paginated([{
          id: 301, title: 'Original Title', content: 'Original content', likeCount: 0, commentCount: 0,
          createdAt: new Date().toISOString(), authorId: 2, authorFullName: 'Client User',
          authorUsername: 'clientuser', status: 'Approved', liked: false, imgs: [], userId: 2
        }]))
      });
    });

    await page.route('**/api/friendships/my-friends*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    // Mock the PUT update
    await page.route(/\/api\/posts\/\d+/, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 301, title: 'Updated Title', content: 'Updated content',
          likeCount: 0, commentCount: 0, authorId: 2, authorFullName: 'Client User',
          authorUsername: 'clientuser', status: 'Approved', liked: false, imgs: [], userId: 2
        })
      });
    });

    await page.goto('/dashboard/client/profile');
    await page.reload();

    // Click the Edit button (pencil icon with title "Edit post") — scope to post card component
    const postCard = page.locator('app-post-card').filter({ hasText: 'Original Title' });
    await expect(postCard).toBeVisible({ timeout: 5000 });
    await postCard.getByTitle('Edit post').click();

    // Edit form appears
    const editInput = postCard.getByPlaceholder('Title');
    await expect(editInput).toBeVisible();
    await editInput.fill('Updated Title');
    await postCard.getByPlaceholder('Content').fill('Updated content');

    // Save
    await postCard.getByRole('button', { name: 'Save', exact: true }).click();

    // Verify updated title is shown
    await expect(page.getByText('Updated Title')).toBeVisible({ timeout: 5000 });
  });

  test('Delete a post from profile (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/posts/me*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(paginated([{
          id: 401, title: 'Post To Delete', content: 'Will be deleted', likeCount: 0, commentCount: 0,
          createdAt: new Date().toISOString(), authorId: 2, authorFullName: 'Client User',
          authorUsername: 'clientuser', status: 'Approved', liked: false, imgs: [], userId: 2
        }]))
      });
    });

    await page.route('**/api/friendships/my-friends*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    // Mock DELETE post
    await page.route(/\/api\/posts\/\d+/, async route => {
      if (await handleOptions(route)) return;
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fallback();
    });

    await page.goto('/dashboard/client/profile');
    await page.reload();

    // Handle the confirm dialog
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Delete this post?');
      dialog.accept();
    });

    // Click delete button (trash icon with title "Delete post") — scope to post card component
    const postCard = page.locator('app-post-card').filter({ hasText: 'Post To Delete' });
    await expect(postCard).toBeVisible({ timeout: 5000 });
    await postCard.getByTitle('Delete post').click();

    // Post should be removed
    await expect(page.getByText('Post To Delete')).not.toBeVisible({ timeout: 5000 });
  });

  test('Edit profile settings (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    // Mock blocked users
    await page.route('**/api/friendships/blocked*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    // Mock reports
    await page.route('**/api/reports/my*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    // Mock PUT /api/clients/edit
    await page.route('**/api/clients/edit', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockClientUser())
      });
    });

    await page.goto('/dashboard/client/settings');
    await page.reload();

    // Edit first name
    const firstNameInput = page.getByPlaceholder('Enter first name');
    await expect(firstNameInput).toBeVisible({ timeout: 5000 });
    await firstNameInput.fill('UpdatedClient');

    // Click Save Changes
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Profile updated successfully')).toBeVisible({ timeout: 5000 });
  });

  test('Change password in settings (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/blocked*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    await page.route('**/api/reports/my*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    // Mock PUT /api/clients/me/password — use regex to match the actual auto-generated URL
    await page.route(/\/api\/clients\/me\/password/, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders(), body: JSON.stringify({}) });
    });

    await page.goto('/dashboard/client/settings');
    await page.reload();

    // Fill password fields
    await page.getByPlaceholder('Enter current password').fill('oldpass123');
    await page.getByPlaceholder('Enter new password').fill('newpass456');
    await page.getByPlaceholder('Confirm new password').fill('newpass456');

    // Wait for form to become valid before clicking
    await expect(page.getByRole('button', { name: 'Change Password' })).toBeEnabled({ timeout: 5000 });

    // Click Change Password — success message is cleared immediately by cancelPassword()
    await page.getByRole('button', { name: 'Change Password' }).click();

    // Verify the form was reset after the API call succeeded
    await expect(page.getByPlaceholder('Enter current password')).toHaveValue('', { timeout: 5000 });
    await expect(page.getByPlaceholder('Enter new password')).toHaveValue('');
    await expect(page.getByPlaceholder('Confirm new password')).toHaveValue('');
  });

  test('Unblock a user in settings (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    const blockedUsers = [{ id: 99, username: 'blockeduser', firstName: 'Blocked', lastName: 'User', fullName: 'Blocked User' }];

    await page.route('**/api/friendships/blocked*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated(blockedUsers)) });
    });

    await page.route('**/api/reports/my*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    // Mock PUT /api/friendships/unblock/{userId} — include CORS headers
    await page.route(/\/api\/friendships\/unblock\/\d+/, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json', headers: corsHeaders(),
        body: JSON.stringify(blockedUsers[0])
      });
    });

    await page.goto('/dashboard/client/settings');
    await page.reload();

    // Click Unblock on the blocked user — opens confirmation modal
    await page.getByRole('button', { name: 'Unblock', exact: true }).first().click();

    // Wait for the unblock confirmation modal to appear
    await expect(page.getByText('Unblock User')).toBeVisible({ timeout: 5000 });

    // Click the Unblock button in the modal (scoped to the modal overlay)
    await page.locator('.fixed.inset-0.z-50').getByRole('button', { name: 'Unblock', exact: true }).click();

    // User should be removed from blocked list
    await expect(page.getByText('No blocked users.')).toBeVisible({ timeout: 5000 });
  });

  test('Upload profile picture (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/blocked*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    await page.route('**/api/reports/my*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
    });

    // Mock POST /api/clients/me/pfp — only match POST, not GET
    await page.route('**/api/clients/me/pfp', async route => {
      if (await handleOptions(route)) return;
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ ...mockClientUser(), pfp: 'new-avatar.jpg' })
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/dashboard/client/settings');
    await page.reload();

    // Verify page loaded with "Settings" title
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 5000 });

    // Set a file on the hidden file input to trigger pfp upload
    await page.locator('input[type="file"]').setInputFiles('e2e/tests/client/assets/test-avatar.png');

    // Wait for the success toast
    await expect(page.getByText('Profile picture updated')).toBeVisible({ timeout: 5000 });
  });
});
