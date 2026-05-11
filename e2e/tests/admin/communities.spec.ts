import { test, expect } from '@playwright/test';
import { AdminCommunitiesPage } from '../../fixtures/admin-communities-page';
import { corsHeaders, paginated } from '../../mocks/helpers';

test.describe('Community Management', () => {

  test('Delete Community (Happy Path)', async ({ page }) => {
    const adminPage = new AdminCommunitiesPage(page);

    await page.route(/\/api\/clients\/me(\?|$)/, async route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin@studyhub.com', role: 'Admin' }) });
    });
    await page.route(/\/api\/communities(\?|$)/, async route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([{ id: 888, title: 'Test Community', description: 'A test community', nbrMembers: 5, ownerId: 1 }])) });
    });
    await page.route(/\/api\/communities\/\d+/, async route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      if (route.request().method() === 'DELETE') return route.fulfill({ status: 204 });
      return route.fallback();
    });

    await adminPage.goto();
    await page.reload();
    await adminPage.waitForTable();
    await adminPage.clickDelete();
    await adminPage.confirmDelete();
    await adminPage.assertDeleted('Test Community');
  });

  test('Search filters communities by title', async ({ page }) => {
    let searchTitle: string | undefined;

    await page.route(/\/api\/clients\/me(\?|$)/, async route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin@studyhub.com', role: 'Admin' }) });
    });
    await page.route(/\/api\/communities(\?|$)/, async route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      const urlObj = new URL(route.request().url());
      searchTitle = urlObj.searchParams.get('title') || undefined;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([{ id: 1, title: 'Searched Community', description: 'Found', nbrMembers: 2 }])) });
    });

    await page.goto('/dashboard/admin/communities');
    await page.reload();

    await page.getByPlaceholder('Search by title...').fill('Searched');
    await page.waitForTimeout(600);
    expect(searchTitle).toBe('Searched');
    await expect(page.getByRole('cell', { name: 'Searched Community' }).first()).toBeVisible();
  });

  test('Pagination navigates between pages', async ({ page }) => {
    let currentPage = 0;

    await page.route(/\/api\/clients\/me(\?|$)/, async route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin@studyhub.com', role: 'Admin' }) });
    });
    await page.route(/\/api\/communities(\?|$)/, async route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() });
      const urlObj = new URL(route.request().url());
      currentPage = parseInt(urlObj.searchParams.get('page') || '0');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated(
        [{ id: currentPage + 1, title: `Page ${currentPage + 1}`, description: '', nbrMembers: 1 }],
        25, currentPage, 10
      )) });
    });

    await page.goto('/dashboard/admin/communities');
    await page.reload();
    await expect(page.getByRole('cell', { name: 'Page 1' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(300);
    expect(currentPage).toBe(1);
    await expect(page.getByRole('cell', { name: 'Page 2' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Previous' }).click();
    await page.waitForTimeout(300);
    expect(currentPage).toBe(0);
  });
});
