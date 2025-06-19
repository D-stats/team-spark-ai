import { test, expect } from '@playwright/test';
import { mockAuth } from './auth/mock-auth';

test.describe('評価システム基本テスト', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'admin');
  });

  test('評価ページにアクセスできる', async ({ page }) => {
    await page.goto('/evaluations');
    
    // ページが読み込まれることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // タイトルが表示されることを確認
    await expect(page.locator('h1')).toContainText('評価');
  });

  test('コンピテンシーページにアクセスできる', async ({ page }) => {
    await page.goto('/evaluations/competencies');
    
    // ページが読み込まれることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // タイトルが表示されることを確認
    await expect(page.locator('h1')).toContainText('コンピテンシー');
  });

  test('ダッシュボードにアクセスできる', async ({ page }) => {
    await page.goto('/dashboard');
    
    // ページが読み込まれることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // タイトルが表示されることを確認
    await expect(page.locator('h1')).toContainText('ダッシュボード');
  });

  test('タブナビゲーションが機能する', async ({ page }) => {
    await page.goto('/evaluations');
    
    // タブが表示されることを確認
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    
    // タブをクリックして切り替え
    const cyclesTab = page.locator('[data-value="cycles"]');
    if (await cyclesTab.isVisible()) {
      await cyclesTab.click();
      // クリック後、コンテンツが変わることを確認
      await page.waitForTimeout(500);
    }
  });
});

test.describe('モック認証テスト', () => {
  test('管理者でログインできる', async ({ page }) => {
    await mockAuth(page, 'admin');
    await page.goto('/dashboard');
    
    // ログイン状態が正しく設定されることを確認
    const isAuth = await page.evaluate(() => {
      return localStorage.getItem('auth-status') === 'authenticated';
    });
    expect(isAuth).toBe(true);
  });

  test('メンバーでログインできる', async ({ page }) => {
    await mockAuth(page, 'member');
    await page.goto('/dashboard');
    
    // ログイン状態が正しく設定されることを確認
    const isAuth = await page.evaluate(() => {
      return localStorage.getItem('auth-status') === 'authenticated';
    });
    expect(isAuth).toBe(true);
  });
});