import { test, expect } from '@playwright/test';
import { mockAuth } from './auth/mock-auth';

test.describe('ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'admin');
  });

  test('ダッシュボードの表示', async ({ page }) => {
    await page.goto('/ja/dashboard');

    // ページタイトルの確認
    await expect(page.locator('h1')).toContainText('ダッシュボード');

    // メインカードの確認
    await expect(page.locator('text=チームのムード')).toBeVisible();
    await expect(page.locator('text=今週のKudos')).toBeVisible();
    await expect(page.locator('text=アクティブなユーザー')).toBeVisible();
  });

  test('ナビゲーションメニューの確認', async ({ page }) => {
    await page.goto('/ja/dashboard');

    // サイドバーのメニューアイテムを確認
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
    await expect(page.locator('text=チーム')).toBeVisible();
    await expect(page.locator('text=Kudos')).toBeVisible();
    await expect(page.locator('text=チェックイン')).toBeVisible();
    await expect(page.locator('text=サーベイ')).toBeVisible();
    await expect(page.locator('text=OKR')).toBeVisible();
    await expect(page.locator('text=評価')).toBeVisible();
    await expect(page.locator('text=設定')).toBeVisible();
  });
});

test.describe('Kudos機能', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'member');
  });

  test('Kudosページの表示', async ({ page }) => {
    await page.goto('/ja/dashboard/kudos');

    await expect(page.locator('h1')).toContainText('Kudos');
    await expect(page.locator('button', { hasText: 'Kudosを送る' })).toBeVisible();
  });

  test('Kudos送信フォームの表示', async ({ page }) => {
    await page.goto('/ja/dashboard/kudos');

    // Kudos送信ボタンをクリック
    await page.click('button:has-text("Kudosを送る")');

    // フォームが表示されることを確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Kudosを送る')).toBeVisible();
  });
});

test.describe('チェックイン機能', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'member');
  });

  test('チェックインページの表示', async ({ page }) => {
    await page.goto('/ja/dashboard/checkins');

    await expect(page.locator('h1')).toContainText('チェックイン');
    await expect(page.locator('button', { hasText: 'チェックインを作成' })).toBeVisible();
  });

  test('チェックイン作成フォームの表示', async ({ page }) => {
    await page.goto('/ja/dashboard/checkins');

    // チェックイン作成ボタンをクリック
    await page.click('button:has-text("チェックインを作成")');

    // フォームが表示されることを確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=チェックイン作成')).toBeVisible();
  });
});

test.describe('チーム管理', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'admin');
  });

  test('チームページの表示', async ({ page }) => {
    await page.goto('/ja/dashboard/teams');

    await expect(page.locator('h1')).toContainText('チーム管理');
    await expect(page.locator('button', { hasText: 'チーム作成' })).toBeVisible();
  });

  test('チーム作成フォームの表示', async ({ page }) => {
    await page.goto('/ja/dashboard/teams');

    // チーム作成ボタンをクリック
    await page.click('button:has-text("チーム作成")');

    // フォームが表示されることを確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=チーム作成')).toBeVisible();
  });
});

test.describe('OKR機能', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'member');
  });

  test('OKRページの表示', async ({ page }) => {
    await page.goto('/ja/okrs');

    // ページが読み込まれることを確認
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('サーベイ機能', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'admin');
  });

  test('サーベイページの表示', async ({ page }) => {
    await page.goto('/ja/dashboard/surveys');

    await expect(page.locator('h1')).toContainText('サーベイ');
    await expect(page.locator('button', { hasText: 'サーベイ作成' })).toBeVisible();
  });

  test('サーベイ作成フォームの表示', async ({ page }) => {
    await page.goto('/ja/dashboard/surveys');

    // サーベイ作成ボタンをクリック
    await page.click('button:has-text("サーベイ作成")');

    // フォームが表示されることを確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=サーベイ作成')).toBeVisible();
  });
});
