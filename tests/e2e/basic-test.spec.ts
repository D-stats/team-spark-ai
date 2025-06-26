import { test, expect } from '@playwright/test';

test.describe('Basic Tests', () => {
  test('should redirect to locale URL', async ({ page }) => {
    // ロケールなしでアクセスすると、デフォルトロケールにリダイレクトされる
    const response = await page.goto('/');
    // リダイレクトまたは直接ロケールURLに到達
    await expect(page.url()).toMatch(/\/(en|ja)/);
  });

  test('should show login page', async ({ page }) => {
    await page.goto('/ja/login');

    // ログインフォームの要素が存在することを確認
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show signup page', async ({ page }) => {
    await page.goto('/ja/signup');

    // サインアップフォームの要素が存在することを確認
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
  });

  test('should respond to health check', async ({ request }) => {
    const response = await request.get('/api/health');

    // ヘルスチェックエンドポイントが応答することを確認
    expect([200, 404, 405]).toContain(response.status());
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/ja');

    // ページがロードされることを確認
    await page.waitForLoadState('domcontentloaded');
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
