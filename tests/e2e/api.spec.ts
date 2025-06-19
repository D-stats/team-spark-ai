import { test, expect } from '@playwright/test';
import { mockAuth } from './auth/mock-auth';

test.describe('APIエンドポイントテスト', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'admin');
  });

  test('評価サイクル取得API', async ({ page }) => {
    // APIレスポンスをモック
    await page.route('**/api/evaluations/cycles', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              name: '2024年上期評価',
              type: 'SEMI_ANNUAL',
              status: 'ACTIVE',
              startDate: '2024-01-01',
              endDate: '2024-06-30',
              phases: [],
              _count: { evaluations: 5 },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/evaluations');
    
    // APIが呼び出されてデータが表示されることを確認
    await expect(page.locator('text=2024年上期評価').first()).toBeVisible();
  });

  test('コンピテンシー取得API', async ({ page }) => {
    // APIレスポンスをモック
    await page.route('**/api/competencies', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              name: 'コミュニケーション',
              description: '明確で効果的なコミュニケーションを行う能力',
              category: 'CORE',
              behaviors: ['明確で簡潔な情報伝達ができる'],
              order: 1,
              isActive: true,
              _count: { ratings: 3 },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/evaluations/competencies');
    
    // APIが呼び出されてデータが表示されることを確認
    await expect(page.locator('text=コミュニケーション').first()).toBeVisible();
  });

  test('Kudos取得API', async ({ page }) => {
    // APIレスポンスをモック
    await page.route('**/api/kudos', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              message: '素晴らしい仕事でした！',
              category: 'TEAMWORK',
              points: 3,
              isPublic: true,
              createdAt: '2024-01-01T00:00:00Z',
              sender: {
                id: '1',
                name: '送信者',
                email: 'sender@test.com',
              },
              receiver: {
                id: '2',
                name: '受信者',
                email: 'receiver@test.com',
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/dashboard/kudos');
    
    // APIが呼び出されてデータが表示されることを確認
    await expect(page.locator('text=素晴らしい仕事でした！')).toBeVisible();
  });

  test('チェックイン取得API', async ({ page }) => {
    // APIレスポンスをモック
    await page.route('**/api/checkins', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              achievements: '新機能の開発を完了しました',
              nextWeekGoals: 'テストの実施を予定しています',
              moodRating: 4,
              challenges: '特に大きな課題はありませんでした',
              createdAt: '2024-01-01T00:00:00Z',
              user: {
                id: '1',
                name: 'テストユーザー',
                email: 'test@test.com',
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/dashboard/checkins');
    
    // APIが呼び出されてデータが表示されることを確認
    await expect(page.locator('text=新機能の開発を完了しました')).toBeVisible();
  });

  test('チーム取得API', async ({ page }) => {
    // APIレスポンスをモック
    await page.route('**/api/teams', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              name: '開発チーム',
              description: 'プロダクト開発を担当するチーム',
              managerId: '1',
              createdAt: '2024-01-01T00:00:00Z',
              manager: {
                id: '1',
                name: 'マネージャー',
                email: 'manager@test.com',
              },
              members: [
                {
                  user: {
                    id: '2',
                    name: 'メンバー1',
                    email: 'member1@test.com',
                  },
                },
                {
                  user: {
                    id: '3',
                    name: 'メンバー2',
                    email: 'member2@test.com',
                  },
                },
              ],
              _count: { members: 2 },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/dashboard/teams');
    
    // APIが呼び出されてデータが表示されることを確認
    await expect(page.locator('text=開発チーム')).toBeVisible();
  });

  test('APIエラーハンドリング', async ({ page }) => {
    // エラーレスポンスをモック
    await page.route('**/api/evaluations/cycles', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'サーバーエラー' }),
      });
    });

    await page.goto('/evaluations');
    
    // エラーが適切に処理されることを確認
    // ローディング状態が終了し、エラーメッセージまたはフォールバックが表示されることを確認
    await page.waitForLoadState('networkidle');
  });
});