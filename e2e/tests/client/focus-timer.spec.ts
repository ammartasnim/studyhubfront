import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, mockClientUser, mockMeAsClient } from '../../mocks/helpers';

test.describe('Client Focus Timer', () => {

  test('View focus timer page', async ({ page }) => {
    await mockMeAsClient(page);

    // Mock no active session
    await page.route('**/api/focus-sessions/active', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
    });

    // Mock empty session history
    await page.route('**/api/focus-sessions/user/*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/dashboard/client/focus-room');
    await page.reload();

    // Verify page heading
    await expect(page.getByText('Focus Mode')).toBeVisible({ timeout: 5000 });

    // Verify preset duration buttons
    await expect(page.getByRole('button', { name: '25m' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: '45m' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: '60m' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Custom' })).toBeVisible({ timeout: 5000 });
  });
});
