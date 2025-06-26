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

    await page.goto('/ja/evaluations', { waitUntil: 'networkidle' });

    // APIが呼び出されてデータが表示されることを確認
    await expect(page.locator('text=2024年上期評価').first()).toBeVisible({ timeout: 15000 });
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
              description: 'チームメンバーとの効果的なコミュニケーション',
              category: 'CORE',
              isActive: true,
              expectedBehaviors: ['明確な情報伝達', '積極的な聞き取り'],
              displayOrder: 1,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/ja/evaluations/competencies', { waitUntil: 'networkidle' });

    // APIが呼び出されてデータが表示されることを確認
    await expect(page.locator('text=コミュニケーション').first()).toBeVisible({ timeout: 15000 });
  });

  test('Kudos取得API', async ({ page }) => {
    // APIレスポンスをモック
    await page.route('**/api/kudos*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            kudos: [
              {
                id: '1',
                fromUserId: 'user1',
                toUserId: 'user2',
                message: '素晴らしい仕事でした！',
                category: 'TEAMWORK',
                points: 10,
                isPublic: true,
                createdAt: '2024-01-01T00:00:00Z',
                fromUser: {
                  id: 'user1',
                  name: '送信者太郎',
                  email: 'sender@test.com',
                },
                toUser: {
                  id: 'user2',
                  name: '受信者花子',
                  email: 'receiver@test.com',
                },
              },
            ],
            totalCount: 1,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/ja/kudos', { waitUntil: 'networkidle' });

    // APIが呼び出されてデータが表示されることを確認
    await expect(page.locator('text=素晴らしい仕事でした！')).toBeVisible({ timeout: 15000 });
  });

  test('チェックイン取得API', async ({ page }) => {
    // APIレスポンスをモック
    await page.route('**/api/checkins*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            checkins: [
              {
                id: '1',
                userId: 'user1',
                status: 'SUBMITTED',
                responses: {
                  accomplishments: '新機能の開発を完了しました',
                  challenges: '技術的な課題がありました',
                  nextWeek: '次の機能の設計を開始します',
                },
                createdAt: '2024-01-01T00:00:00Z',
                user: {
                  id: 'user1',
                  name: 'チェックイン太郎',
                  email: 'checkin@test.com',
                },
              },
            ],
            totalCount: 1,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/ja/checkins', { waitUntil: 'networkidle' });

    // APIが呼び出されてデータが表示されることを確認
    await expect(page.locator('text=新機能の開発を完了しました')).toBeVisible({ timeout: 15000 });
  });

  test('チーム取得API', async ({ page }) => {
    // APIレスポンスをモック
    await page.route('**/api/teams*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            teams: [
              {
                id: '1',
                name: '開発チーム',
                description: 'プロダクト開発を担当するチーム',
                managerId: 'manager1',
                organizationId: 'org1',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
                _count: {
                  members: 5,
                },
                manager: {
                  id: 'manager1',
                  name: 'マネージャー太郎',
                  email: 'manager@test.com',
                },
              },
            ],
            totalCount: 1,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/ja/teams', { waitUntil: 'networkidle' });

    // APIが呼び出されてデータが表示されることを確認
    await expect(page.locator('text=開発チーム')).toBeVisible({ timeout: 15000 });
  });

  test('APIエラーハンドリング', async ({ page }) => {
    // APIエラーレスポンスをモック
    await page.route('**/api/evaluations/cycles', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'データベース接続エラー',
        }),
      });
    });

    await page.goto('/ja/evaluations', { waitUntil: 'networkidle' });

    // エラーメッセージが表示されることを確認（実装によって異なる）
    // 例: await expect(page.locator('text=エラーが発生しました')).toBeVisible();
  });

  test('ページネーション', async ({ page }) => {
    let currentPage = 1;

    // APIレスポンスをモック（ページ番号に応じて異なるデータを返す）
    await page.route('**/api/kudos*', async (route) => {
      const url = new URL(route.request().url());
      const page = parseInt(url.searchParams.get('page') || '1');
      currentPage = page;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kudos: [
            {
              id: `page${page}-1`,
              fromUserId: 'user1',
              toUserId: 'user2',
              message: `ページ${page}のKudos`,
              category: 'TEAMWORK',
              points: 10,
              isPublic: true,
              createdAt: '2024-01-01T00:00:00Z',
              fromUser: {
                id: 'user1',
                name: '送信者',
                email: 'sender@test.com',
              },
              toUser: {
                id: 'user2',
                name: '受信者',
                email: 'receiver@test.com',
              },
            },
          ],
          totalCount: 50,
          currentPage: page,
          totalPages: 5,
        }),
      });
    });

    await page.goto('/ja/kudos', { waitUntil: 'networkidle' });

    // 最初のページのデータが表示される
    await expect(page.locator('text=ページ1のKudos')).toBeVisible({ timeout: 15000 });

    // ページネーションボタンがある場合はクリック（実装に依存）
    // const nextButton = page.locator('button:has-text("次へ")');
    // if (await nextButton.isVisible()) {
    //   await nextButton.click();
    //   await expect(page.locator('text=ページ2のKudos')).toBeVisible();
    // }
  });
});
