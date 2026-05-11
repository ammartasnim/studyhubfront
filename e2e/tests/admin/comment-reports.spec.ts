import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, paginated } from '../../mocks/helpers';

test('View comment reports page', async ({ page }) => {
  await page.route(/\/api\/clients\/me(\?|$)/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin@studyhub.com', role: 'Admin' }) });
  });

  await page.route(/\/api\/reports\/comments\/grouped/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          commentId: 201,
          content: 'This is a bad comment',
          authorUsername: 'baduser',
          postTitle: 'Some Post',
          approvedReports: 3,
          totalReports: 4,
          status: 'Active',
          hasPendingReports: true,
          latestReportDate: new Date().toISOString(),
          reasons: { HARASSMENT: 2, SPAM: 2 }
        }
      ])
    });
  });

  await page.goto('/dashboard/admin/comments');
  await page.reload();

  await expect(page.getByText('Comment Reports')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('This is a bad comment')).toBeVisible({ timeout: 5000 });
});
