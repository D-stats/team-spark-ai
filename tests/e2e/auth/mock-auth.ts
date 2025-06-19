import { Page } from '@playwright/test';

// モック認証情報
export const TEST_USERS = {
  admin: {
    id: 'admin-test-id',
    email: 'admin@test.com',
    name: '管理者太郎',
    role: 'ADMIN',
    organizationId: 'test-org-id',
  },
  manager: {
    id: 'manager-test-id',
    email: 'manager@test.com',
    name: 'マネージャー花子',
    role: 'MANAGER',
    organizationId: 'test-org-id',
  },
  member: {
    id: 'member-test-id',
    email: 'member1@test.com',
    name: 'メンバー一郎',
    role: 'MEMBER',
    organizationId: 'test-org-id',
  },
};

// モック認証のセットアップ
export async function mockAuth(page: Page, userType: 'admin' | 'manager' | 'member') {
  const user = TEST_USERS[userType];
  
  // フェイクのセッションデータをセット
  await page.addInitScript((userData) => {
    // localStorageにユーザー情報をセット
    localStorage.setItem('test-user', JSON.stringify(userData));
    
    // 認証ステータスをセット
    localStorage.setItem('auth-status', 'authenticated');
  }, user);
  
  // APIリクエストをモック
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後
      }),
    });
  });
  
  // ユーザー情報取得APIをモック
  await page.route('**/api/user/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });
}

// 認証状態の確認
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return localStorage.getItem('auth-status') === 'authenticated';
  });
}

// ログアウト
export async function logout(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('test-user');
    localStorage.removeItem('auth-status');
  });
}