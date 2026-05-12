import { Page, expect } from '@playwright/test';

export class AdminUsersPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard/admin/users');
  }

  async waitForTable() {
    await expect(this.page.getByText('test@user.com')).toBeVisible();
  }

  get banButton() {
    return this.page.getByRole('button', { name: 'Ban', exact: true }).first();
  }

  get unbanButton() {
    return this.page.getByRole('button', { name: 'Unban' }).first();
  }

  get confirmBanButton() {
    return this.page.getByRole('button', { name: 'Ban', exact: true }).last();
  }

  get modalHeading() {
    return this.page.getByText('Ban User?');
  }

  async clickBan() {
    await this.banButton.click();
    await expect(this.modalHeading).toBeVisible();
  }

  async confirmBan() {
    await this.confirmBanButton.click();
  }

  async assertBanned(email: string) {
    await expect(this.unbanButton).toBeVisible({ timeout: 10000 });
    const row = this.page.locator('tr').filter({ hasText: email });
    await expect(row.locator('span:has-text("Banned")')).toBeVisible();
  }
}
