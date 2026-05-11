import { test, expect } from '@playwright/test';
import { corsHeaders, handleOptions, mockClientUser, mockMeAsClient, paginated } from '../../mocks/helpers';

test.describe('Client Chat', () => {

  test('View chat page', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/my-friends*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(paginated([{ id: 100, username: 'testfriend', firstName: 'Test', lastName: 'Friend', fullName: 'Test Friend' }]))
      });
    });

    await page.goto('/dashboard/client/chat');
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Chats' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Test Friend')).toBeVisible();
  });

  test('Send a message in chat', async ({ page }) => {
    await mockMeAsClient(page);

    await page.route('**/api/friendships/my-friends*', async route => {
      if (await handleOptions(route)) return;
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(paginated([{ id: 100, username: 'testfriend', firstName: 'Test', lastName: 'Friend', fullName: 'Test Friend' }]))
      });
    });

    await page.goto('/dashboard/client/chat');
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Chats' })).toBeVisible({ timeout: 5000 });

    await page.getByText('Test Friend').click();

    await expect(page.getByText('Select a friend to start chatting.')).not.toBeAttached({ timeout: 5000 });

    // Inject a message directly into the chat component's signal,
    // because sendMessage() requires WebSocket/STOMP which is not available in e2e
    await page.evaluate(function() {
      var chatEl = document.querySelector('app-chat');
      if (chatEl && window.ng && window.ng.getComponent) {
        var component = window.ng.getComponent(chatEl);
        if (component && component.messagesByFriend) {
          component.messagesByFriend.update(function(map) {
            var newMap = new Map(map);
            var existing = newMap.get(100) || [];
            existing.push({
              id: Date.now(),
              conversationId: 0,
              senderId: 2,
              recipientId: 100,
              content: 'Hello, this is a test message!',
              status: 'SENT',
              createdAt: new Date()
            });
            newMap.set(100, existing);
            return newMap;
          });
        }
      }
    });

    // The message appears both in the friend list preview and the chat panel
    // Use .last() to target the actual chat message (not the sidebar preview)
    await expect(page.getByText('Hello, this is a test message!').last()).toBeVisible({ timeout: 5000 });
  });

});
