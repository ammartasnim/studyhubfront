import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, paginated } from '../../mocks/helpers';

test('View post reports page', async ({ page }) => {
  await page.route(/\/api\/clients\/me(\?|$)/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin@studyhub.com', role: 'Admin' }) });
  });

  await page.route(/\/api\/reports\/posts\/grouped/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          postId: 101,
          title: 'Flagged Post',
          authorUsername: 'offender',
          communityTitle: 'Some Community',
          approvedReports: 6,
          totalReports: 8,
          status: 'Flagged',
          hasPendingReports: true,
          latestReportDate: new Date().toISOString(),
          reasons: { SPAM: 4, INAPPROPRIATE: 4 }
        }
      ])
    });
  });

  await page.goto('/dashboard/admin/posts');
  await page.reload();

  await expect(page.getByText('Post Reports')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Flagged Post')).toBeVisible({ timeout: 5000 });
});
