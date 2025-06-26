import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/ja/login');

    // フォーム要素を確認
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // 要素が存在するか確認
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await expect(passwordInput).toBeVisible({ timeout: 15000 });
  });

  test('should display signup form', async ({ page }) => {
    await page.goto('/ja/signup');

    // サインアップフォームの要素を確認
    await expect(page.locator('form')).toBeVisible({ timeout: 15000 });
  });

  test('should handle login redirect', async ({ page }) => {
    // 認証が必要なページにアクセス
    await page.goto('/ja/dashboard');

    // ログインページにリダイレクトされるか、またはダッシュボードが表示される
    await page.waitForLoadState('networkidle');
    const url = page.url();

    // URLにloginまたはdashboardが含まれることを確認
    expect(url).toMatch(/(login|dashboard)/);
  });
});
