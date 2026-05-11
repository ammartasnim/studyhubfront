import { test, expect } from '@playwright/test';
import { mockMeAsAdmin } from '../../mocks/helpers';

test.describe('Logout', () => {

  test('Logout clears token and redirects to login', async ({ page }) => {
    await mockMeAsAdmin(page);

    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('button', { name: /logout/i }).click();

    await expect(page).toHaveURL(/\/auth\/login/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});
