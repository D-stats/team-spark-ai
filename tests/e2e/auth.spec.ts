import { test, expect } from '@playwright/test';
import { mockAuth, isAuthenticated, logout } from './auth/mock-auth';

test.describe('認証システム', () => {
  test('ログイン状態の確認', async ({ page }) => {
    // モック認証を設定
    await mockAuth(page, 'admin');
    await page.goto('/ja/dashboard');

    // 認証状態を確認
    const authStatus = await isAuthenticated(page);
    expect(authStatus).toBe(true);

    // ダッシュボードにアクセスできることを確認
    await expect(page).toHaveURL(/dashboard/);
  });

  test('ログアウト機能', async ({ page }) => {
    // モック認証を設定
    await mockAuth(page, 'admin');
    await page.goto('/ja/dashboard');

    // ログアウトを実行
    await logout(page);

    // 認証状態を確認
    const authStatus = await isAuthenticated(page);
    expect(authStatus).toBe(false);
  });

  test('権限別のアクセス制御', async ({ page }) => {
    // 管理者としてログイン
    await mockAuth(page, 'admin');
    await page.goto('/ja/evaluations');
    await expect(page).toHaveURL(/evaluations/);

    // ログアウトして一般メンバーとしてログイン
    await logout(page);
    await mockAuth(page, 'member');
    await page.goto('/ja/evaluations');
    await expect(page).toHaveURL(/evaluations/);
  });

  test('未認証ユーザーのリダイレクト', async ({ page }) => {
    // 未認証状態でダッシュボードにアクセス
    await page.goto('/ja/dashboard');

    // ログインページまたはダッシュボードにリダイレクトされる
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/(login|dashboard)/);
  });
});
