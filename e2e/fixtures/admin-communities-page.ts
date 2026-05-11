import { Page, expect } from '@playwright/test';

export class AdminCommunitiesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard/admin/communities');
  }

  async waitForTable() {
    await expect(this.page.getByRole('cell', { name: 'Test Community' }).first()).toBeVisible();
  }

  get deleteButton() {
    return this.page.getByRole('button', { name: 'Delete', exact: true }).first();
  }

  get confirmDeleteButton() {
    return this.page.getByRole('button', { name: 'Delete', exact: true }).last();
  }

  get modalHeading() {
    return this.page.getByText('Delete Community?');
  }

  async clickDelete() {
    await this.deleteButton.click();
    await expect(this.modalHeading).toBeVisible();
  }

  async confirmDelete() {
    await this.confirmDeleteButton.click();
  }

  async assertDeleted(title: string) {
    await expect(this.page.getByRole('cell', { name: title }).first()).not.toBeVisible({ timeout: 10000 });
  }
}
