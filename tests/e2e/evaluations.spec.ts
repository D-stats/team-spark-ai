import { test, expect } from '@playwright/test';
import { mockAuth } from './auth/mock-auth';

test.describe('評価システム', () => {
  test.beforeEach(async ({ page }) => {
    // 管理者としてログイン
    await mockAuth(page, 'admin');
  });

  test('評価ダッシュボードの表示', async ({ page }) => {
    await page.goto('/evaluations');
    
    // ページタイトルの確認
    await expect(page.locator('h1')).toContainText('評価管理');
    
    // 概要カードの確認
    await expect(page.locator('[data-testid="active-cycle-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-evaluations-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-cycles-card"]')).toBeVisible();
    
    // タブの確認
    await expect(page.locator('[data-value="overview"]')).toBeVisible();
    await expect(page.locator('[data-value="cycles"]')).toBeVisible();
    await expect(page.locator('[data-value="my-evaluations"]')).toBeVisible();
  });

  test('評価サイクル一覧の表示', async ({ page }) => {
    await page.goto('/evaluations');
    
    // サイクルタブをクリック
    await page.click('[data-value="cycles"]');
    
    // サイクルカードの確認
    await expect(page.locator('.space-y-6 .grid')).toBeVisible();
  });

  test('私の評価一覧の表示', async ({ page }) => {
    await page.goto('/evaluations');
    
    // 私の評価タブをクリック
    await page.click('[data-value="my-evaluations"]');
    
    // 評価リストの確認
    await expect(page.locator('.grid .space-y-4')).toBeVisible();
  });

  test('評価サイクル作成ボタンの表示', async ({ page }) => {
    await page.goto('/evaluations');
    
    // 作成ボタンの確認
    await expect(page.locator('button', { hasText: '評価サイクル作成' })).toBeVisible();
  });
});

test.describe('コンピテンシー管理', () => {
  test.beforeEach(async ({ page }) => {
    // 管理者としてログイン
    await mockAuth(page, 'admin');
  });

  test('コンピテンシー一覧の表示', async ({ page }) => {
    await page.goto('/evaluations/competencies');
    
    // ページタイトルの確認
    await expect(page.locator('h1')).toContainText('コンピテンシー管理');
    
    // 作成ボタンの確認
    await expect(page.locator('button', { hasText: 'コンピテンシー作成' })).toBeVisible();
    
    // フィルターの確認
    await expect(page.locator('input[placeholder*="コンピテンシーを検索"]')).toBeVisible();
  });

  test('デフォルトコンピテンシーの初期化', async ({ page }) => {
    // コンピテンシーをクリアしてテスト
    await page.route('**/api/competencies', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]), // 空のリスト
        });
      } else {
        await route.continue();
      }
    });
    
    await page.goto('/evaluations/competencies');
    
    // 空状態のメッセージ確認
    await expect(page.locator('text=コンピテンシーがありません')).toBeVisible();
    
    // デフォルト初期化ボタンの確認
    await expect(page.locator('button', { hasText: 'デフォルトを初期化' })).toBeVisible();
  });

  test('コンピテンシー作成ダイアログの表示', async ({ page }) => {
    await page.goto('/evaluations/competencies');
    
    // 作成ボタンをクリック
    await page.click('button:has-text("コンピテンシー作成")');
    
    // ダイアログの確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=コンピテンシー作成')).toBeVisible();
    
    // フォームフィールドの確認
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('textarea[id="description"]')).toBeVisible();
    await expect(page.locator('[role="combobox"]')).toBeVisible(); // カテゴリ選択
  });

  test('コンピテンシーのフィルタリング', async ({ page }) => {
    await page.goto('/evaluations/competencies');
    
    // 検索フィールドに入力
    await page.fill('input[placeholder*="コンピテンシーを検索"]', 'コミュニケーション');
    
    // フィルタリング結果を確認するための待機
    await page.waitForTimeout(500);
  });
});

test.describe('権限テスト', () => {
  test('メンバーはコンピテンシー作成ボタンが表示されない', async ({ page }) => {
    await mockAuth(page, 'member');
    await page.goto('/evaluations/competencies');
    
    // メンバーには作成ボタンが表示されないことを確認
    await expect(page.locator('button', { hasText: 'コンピテンシー作成' })).not.toBeVisible();
  });

  test('マネージャーはコンピテンシー作成ボタンが表示される', async ({ page }) => {
    await mockAuth(page, 'manager');
    await page.goto('/evaluations/competencies');
    
    // マネージャーには作成ボタンが表示されることを確認
    await expect(page.locator('button', { hasText: 'コンピテンシー作成' })).toBeVisible();
  });
});

test.describe('レスポンシブテスト', () => {
  test('モバイルビューでの表示', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    await mockAuth(page, 'admin');
    await page.goto('/evaluations');
    
    // モバイルビューでもコンテンツが表示されることを確認
    await expect(page.locator('h1')).toContainText('評価管理');
    await expect(page.locator('[data-testid="active-cycle-card"]')).toBeVisible();
  });

  test('タブレットビューでの表示', async ({ page }) => {
    // タブレットサイズに設定
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await mockAuth(page, 'admin');
    await page.goto('/evaluations');
    
    // タブレットビューでもコンテンツが表示されることを確認
    await expect(page.locator('h1')).toContainText('評価管理');
    await expect(page.locator('[data-testid="active-cycle-card"]')).toBeVisible();
  });
});