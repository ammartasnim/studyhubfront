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

test('Approve and reject post reports', async ({ page }) => {
  await page.route(/\/api\/clients\/me(\?|$)/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin@studyhub.com', role: 'Admin' }) });
  });

  let approveCalled = false;
  let rejectCalled = false;

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

  await page.route(/\/api\/reports\/posts\/101/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, reporterUsername: 'reporter1', reason: 'SPAM', status: approveCalled ? 'APPROVED' : 'PENDING', createdAt: new Date().toISOString() },
        { id: 2, reporterUsername: 'reporter2', reason: 'INAPPROPRIATE', status: rejectCalled ? 'REJECTED' : 'PENDING', createdAt: new Date().toISOString() }
      ])
    });
  });

  await page.route(/\/api\/reports\/1\/approve/, async route => {
    if (await handleOptions(route)) return;
    approveCalled = true;
    await route.fulfill({ status: 200, headers: corsHeaders(), body: 'ok' });
  });

  await page.route(/\/api\/reports\/2\/reject/, async route => {
    if (await handleOptions(route)) return;
    rejectCalled = true;
    await route.fulfill({ status: 200, headers: corsHeaders(), body: 'ok' });
  });

  await page.goto('/dashboard/admin/posts');
  await page.reload();

  // Use force:true because <app-admin-post-reports> overlays the table
  await page.getByText('Flagged Post').first().click({ force: true });
  await expect(page.getByText('reporter1')).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: 'Approve' }).first().click();
  await expect(page.getByRole('button', { name: 'Approved' })).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: 'Reject' }).click();
  await expect(page.getByRole('button', { name: 'Rejected' })).toBeVisible({ timeout: 5000 });
});
