import { test, expect } from '@playwright/test';

// テスト用のユーザー情報
const testUser = {
  email: 'admin@test.com',
  password: 'password123',
  name: '管理者太郎',
};

test.describe('基本機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログインページへ移動
    await page.goto('/ja/login');
  });

  test('ログイン機能', async ({ page }) => {
    // ログインフォームの入力
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    // ログインボタンをクリック
    await page.click('button[type="submit"]');

    // ダッシュボードへのリダイレクトを待つ
    await page.waitForURL('**/dashboard');

    // ダッシュボードが表示されていることを確認
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('サイドバーナビゲーション', async ({ page }) => {
    // ログイン
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // サイドバーが表示されていることを確認
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();

    // 各ナビゲーションリンクの存在確認
    const navItems = [
      { text: 'ダッシュボード', href: '/dashboard' },
      { text: 'OKR', href: '/okrs' },
      { text: 'Kudos', href: '/dashboard/kudos' },
      { text: 'チェックイン', href: '/dashboard/checkins' },
      { text: 'サーベイ', href: '/dashboard/surveys' },
      { text: 'チーム', href: '/dashboard/teams' },
      { text: '組織設定', href: '/dashboard/organization' },
      { text: '個人設定', href: '/dashboard/settings' },
    ];

    for (const item of navItems) {
      const link = page.locator(`a:has-text("${item.text}")`);
      await expect(link).toBeVisible();
    }
  });

  test('OKRページでサイドバーが表示される', async ({ page }) => {
    // ログイン
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // OKRページへ移動
    await page.click('a:has-text("OKR")');
    await page.waitForURL('**/okrs');

    // サイドバーが表示されていることを確認
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();

    // OKRページのコンテンツが表示されていることを確認
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('ヘッダーにユーザー情報が表示される', async ({ page }) => {
    // ログイン
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // ヘッダーが表示されていることを確認
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // ユーザーアイコンをクリックしてドロップダウンを開く
    const userButton = page
      .locator('header button')
      .filter({ has: page.locator('svg') })
      .first();
    await userButton.click();

    // ドロップダウン内でメールアドレスが表示されていることを確認
    await expect(page.locator('text=' + testUser.email)).toBeVisible();
  });

  test('ページ間のナビゲーション', async ({ page }) => {
    // ログイン
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // チームページへ移動
    await page.click('a:has-text("チーム")');
    await page.waitForURL('**/teams');
    await expect(page).toHaveURL(/\/teams$/);

    // Kudosページへ移動
    await page.click('a:has-text("Kudos")');
    await page.waitForURL('**/kudos');
    await expect(page).toHaveURL(/\/kudos$/);

    // 各ページでサイドバーが表示されていることを確認
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();
  });

  test('ログアウト機能', async ({ page }) => {
    // ログイン
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // ユーザーメニューをクリック（ドロップダウンがある場合）
    const userMenuButton = page.locator('button').filter({ hasText: testUser.email }).first();
    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();

      // ログアウトオプションをクリック
      const logoutButton = page.locator('text=ログアウト').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();

        // ログインページへのリダイレクトを確認
        await page.waitForURL('**/login');
        await expect(page).toHaveURL(/\/login/);
      }
    }
  });
});

test.describe('エラーハンドリング', () => {
  test('無効な認証情報でのログイン', async ({ page }) => {
    await page.goto('/ja/login');

    // 無効な認証情報を入力
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=/Invalid login credentials|ログインに失敗しました/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('未認証でのアクセス', async ({ page }) => {
    // 直接ダッシュボードにアクセス
    await page.goto('/ja/dashboard');

    // ログインページへリダイレクトされることを確認
    await page.waitForURL('**/login**');
    await expect(page).toHaveURL(/\/login/);
  });
});
