import { Page } from '@playwright/test';

export function corsHeaders(extra?: Record<string, string>) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...extra,
  };
}

export async function handleOptions(route: any): Promise<boolean> {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: corsHeaders() });
    return true;
  }
  return false;
}

export function mockAdminUser() {
  return {
    id: 1, email: 'admin@studyhub.com', role: 'Admin' as const,
    username: 'admin', firstName: 'Admin', lastName: 'User',
    banned: false, badges: [], phone: '', xpPts: 0, level: 1, pfp: null,
  };
}

export function mockClientUser() {
  return {
    id: 2, email: 'client@studyhub.com', role: 'Client' as const,
    username: 'client', firstName: 'Client', lastName: 'User',
    banned: false, badges: [], phone: '+1234567890', xpPts: 150, level: 3, pfp: null,
  };
}

export function paginated<T>(items: T[], total = items.length, page = 0, size = 10) {
  return {
    content: items,
    totalElements: total,
    totalPages: Math.ceil(total / size),
    number: page,
    size,
    first: page === 0,
    last: (page + 1) * size >= total,
    empty: items.length === 0,
  };
}

export async function mockMeAsAdmin(page: Page) {
  await page.route(/\/api\/clients\/me(\?|$)/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAdminUser()) });
  });
}

export async function mockMeAsClient(page: Page) {
  await page.route(/\/api\/clients\/me(\?|$)/, async route => {
    if (await handleOptions(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockClientUser()) });
  });
}
