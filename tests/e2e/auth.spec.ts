import { test, expect } from '@playwright/test';
import { mockAuth, isAuthenticated, logout } from './auth/mock-auth';

test.describe('認証システム', () => {
  test('ログイン状態の確認', async ({ page }) => {
    // モック認証を設定
    await mockAuth(page, 'admin');
    await page.goto('/dashboard');

    // 認証状態を確認
    const authStatus = await isAuthenticated(page);
    expect(authStatus).toBe(true);

    // ダッシュボードにアクセスできることを確認
    await expect(page.locator('h1')).toContainText('ダッシュボード');
  });

  test('ログアウト機能', async ({ page }) => {
    // モック認証を設定
    await mockAuth(page, 'admin');
    await page.goto('/dashboard');

    // ログアウトを実行
    await logout(page);

    // 認証状態を確認
    const authStatus = await isAuthenticated(page);
    expect(authStatus).toBe(false);
  });

  test('管理者権限の確認', async ({ page }) => {
    await mockAuth(page, 'admin');
    await page.goto('/dashboard/teams');

    // 管理者はチーム作成ボタンが表示される
    await expect(page.locator('button', { hasText: 'チーム作成' })).toBeVisible();
  });

  test('メンバー権限の確認', async ({ page }) => {
    await mockAuth(page, 'member');
    await page.goto('/dashboard/teams');

    // メンバーはチーム作成ボタンが表示されない
    await expect(page.locator('button', { hasText: 'チーム作成' })).not.toBeVisible();
  });

  test('マネージャー権限の確認', async ({ page }) => {
    await mockAuth(page, 'manager');
    await page.goto('/dashboard/teams');

    // マネージャーはチーム作成ボタンが表示される
    await expect(page.locator('button', { hasText: 'チーム作成' })).toBeVisible();
  });
});

test.describe('ユーザープロフィール', () => {
  test('プロフィール情報の表示', async ({ page }) => {
    await mockAuth(page, 'admin');
    await page.goto('/dashboard/settings');

    // プロフィール情報が表示されることを確認
    await expect(page.locator('text=プロフィール設定')).toBeVisible();
  });

  test('設定ページのアクセス', async ({ page }) => {
    await mockAuth(page, 'admin');
    await page.goto('/dashboard/settings');

    // 設定ページが正常に表示されることを確認
    await expect(page.locator('h1')).toContainText('設定');
  });
});
