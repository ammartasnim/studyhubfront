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

test('Approve and reject comment reports', async ({ page }) => {
  await page.route(/\/api\/clients\/me(\?|$)/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin@studyhub.com', role: 'Admin' }) });
  });

  let approveCalled = false;
  let rejectCalled = false;

  await page.route(/\/api\/reports\/comments\/grouped/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          commentId: 201,
          content: 'Bad comment',
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

  await page.route(/\/api\/reports\/comments\/201/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 10, reporterUsername: 'reporter1', reason: 'HARASSMENT', status: approveCalled ? 'APPROVED' : 'PENDING', createdAt: new Date().toISOString() },
        { id: 11, reporterUsername: 'reporter2', reason: 'SPAM', status: rejectCalled ? 'REJECTED' : 'PENDING', createdAt: new Date().toISOString() }
      ])
    });
  });

  await page.route(/\/api\/reports\/10\/approve/, async route => {
    if (await handleOptions(route)) return;
    approveCalled = true;
    await route.fulfill({ status: 200, headers: corsHeaders(), body: 'ok' });
  });

  await page.route(/\/api\/reports\/11\/reject/, async route => {
    if (await handleOptions(route)) return;
    rejectCalled = true;
    await route.fulfill({ status: 200, headers: corsHeaders(), body: 'ok' });
  });

  await page.goto('/dashboard/admin/comments');
  await page.reload();

  // Use force:true because <app-admin-comment-reports> overlays the table
  await page.getByText('Bad comment').first().click({ force: true });
  await expect(page.getByText('reporter1')).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: 'Approve' }).first().click();
  await expect(page.getByRole('button', { name: 'Approved' })).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: 'Reject' }).click();
  await expect(page.getByRole('button', { name: 'Rejected' })).toBeVisible({ timeout: 5000 });
});
