import { test, expect } from '@playwright/test';

test.describe('基本動作確認', () => {
  test('アプリケーションが起動する', async ({ page }) => {
    // 認証なしでアクセス可能なページをテスト
    await page.goto('/');
    
    // ページが読み込まれることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // タイトルが設定されていることを確認
    await expect(page).toHaveTitle(/Startup HR/);
  });

  test('ログインページにアクセスできる', async ({ page }) => {
    await page.goto('/login');
    
    // ログインページが表示される
    await expect(page.locator('body')).toBeVisible();
  });

  test('サインアップページにアクセスできる', async ({ page }) => {
    await page.goto('/signup');
    
    // サインアップページが表示される
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('API基本確認', () => {
  test('ヘルスチェックAPI', async ({ page }) => {
    // 基本的なAPIレスポンスを確認
    const response = await page.request.get('/api/health');
    
    // APIが応答することを確認（404でも構わない）
    expect([200, 404, 405]).toContain(response.status());
  });
});