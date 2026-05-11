import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, mockClientUser, mockMeAsClient, paginated } from '../../mocks/helpers';

test.describe('Client Friendships', () => {

  test('Send friend request (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    // Mock /api/friendships/suggestions
    await page.route('**/api/friendships/suggestions*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(paginated([{ id: 50, username: 'suggesteduser', firstName: 'Suggested', lastName: 'User', fullName: 'Suggested User' }]))
      });
    });

    // Mock POST /api/friendships/request/{addresseeId}
    await page.route(/\/api\/friendships\/request\/\d+/, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 201, contentType: 'application/json',
        body: JSON.stringify({ requesterId: 2, addresseeId: 50, status: 'Pending', requester: null, addressee: null })
      });
    });

    await page.goto('/dashboard/client/suggestedFriends');
    await page.reload();

    // Find the suggested user and click "Add Friend"
    const addFriendBtn = page.locator('text=Suggested User').locator('..').locator('..').getByRole('button', { name: 'Add Friend' });
    await expect(addFriendBtn).toBeVisible({ timeout: 5000 });
    await addFriendBtn.click();

    // After sending, the request is successful — the user will be removed from suggestions on next load
    // Just verify no error occurred (page doesn't reload, the action succeeds silently)
    // We verify by checking the request was made: the user may now show "Cancel" if the component re-renders
    await expect(page.getByText('Suggested User')).not.toBeAttached({ timeout: 5000 });
  });

  test('Accept friend request (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/suggestions*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });

    // Mock pending requests
    await page.route('**/api/friendships/pending*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(paginated([{
          requesterId: 60, addresseeId: 2, status: 'Pending',
          requester: { id: 60, username: 'pendinguser', firstName: 'Pending', lastName: 'User', fullName: 'Pending User' }
        }]))
      });
    });

    // Mock PUT /api/friendships/accept/{requesterId}
    await page.route(/\/api\/friendships\/accept\/\d+/, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ requesterId: 60, addresseeId: 2, status: 'Accepted' })
      });
    });

    await page.goto('/dashboard/client/suggestedFriends');
    await page.reload();

    // Click Pending Requests tab
    await page.getByRole('button', { name: 'Pending Requests' }).click();
    await page.waitForTimeout(300);

    // Find Accept button
    await expect(page.getByText('Pending User')).toBeVisible({ timeout: 5000 });
    const acceptBtn = page.locator('text=Pending User').locator('..').locator('..').getByRole('button', { name: 'Accept' });
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();

    // The user should be removed from the pending list
    await expect(page.getByText('Pending User')).not.toBeAttached({ timeout: 5000 });
  });

  test('Decline friend request (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/suggestions*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });

    await page.route('**/api/friendships/pending*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(paginated([{
          requesterId: 70, addresseeId: 2, status: 'Pending',
          requester: { id: 70, username: 'decliner', firstName: 'Decline', lastName: 'Me', fullName: 'Decline Me' }
        }]))
      });
    });

    // Mock DELETE /api/friendships/{friendId}
    await page.route(/\/api\/friendships\/\d+/, async route => {
      if (await handleOptions(route)) return;
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fallback();
    });

    await page.goto('/dashboard/client/suggestedFriends');
    await page.reload();

    await page.getByRole('button', { name: 'Pending Requests' }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText('Decline Me')).toBeVisible({ timeout: 5000 });
    const declineBtn = page.locator('text=Decline Me').locator('..').locator('..').getByRole('button', { name: 'Decline' });
    await expect(declineBtn).toBeVisible();
    await declineBtn.click();

    await expect(page.getByText('Decline Me')).not.toBeAttached({ timeout: 5000 });
  });

  test('Cancel sent request (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/suggestions*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });

    await page.route('**/api/friendships/pending*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });

    await page.route('**/api/friendships/sent*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(paginated([{
          requesterId: 2, addresseeId: 80, status: 'Pending',
          addressee: { id: 80, username: 'sentuser', firstName: 'Sent', lastName: 'User', fullName: 'Sent User' }
        }]))
      });
    });

    // Mock DELETE endpoint for cancel
    await page.route(/\/api\/friendships\/\d+/, async route => {
      if (await handleOptions(route)) return;
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fallback();
    });

    await page.goto('/dashboard/client/suggestedFriends');
    await page.reload();

    await page.getByRole('button', { name: 'Sent Requests' }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText('Sent User')).toBeVisible({ timeout: 5000 });
    const cancelBtn = page.locator('text=Sent User').locator('..').locator('..').getByRole('button', { name: 'Cancel' });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    await expect(page.getByText('Sent User')).not.toBeAttached({ timeout: 5000 });
  });

  test('Block user from suggested friends (Happy Path)', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/suggestions*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(paginated([{ id: 90, username: 'blocktarget', firstName: 'Block', lastName: 'Target', fullName: 'Block Target' }]))
      });
    });

    await page.route(/\/api\/friendships\/block\/\d+/, async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ id: 90, username: 'blocktarget', fullName: 'Block Target' })
      });
    });

    await page.goto('/dashboard/client/suggestedFriends');
    await page.reload();

    // Click Block button
    await expect(page.getByText('Block Target')).toBeVisible({ timeout: 5000 });
    const blockBtn = page.locator('text=Block Target').locator('..').locator('..').getByRole('button', { name: 'Block' });
    await expect(blockBtn).toBeVisible();
    await blockBtn.click();

    // Confirm block modal appears — use last() to target modal button (not the list button behind overlay)
    await expect(page.getByText("Block this user?")).toBeVisible();
    await page.getByRole('button', { name: 'Block', exact: true }).last().click();

    await expect(page.getByText('Block Target')).not.toBeAttached({ timeout: 5000 });
  });
});
