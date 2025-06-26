# E2E テストガイド

## 概要

このプロジェクトでは、Playwright を使用してエンドツーエンド（E2E）テストを実施しています。テストは headless Chromium で実行され、主要な機能の動作を検証します。

## テスト構成

### テストファイル

- `auth.spec.ts` - 認証システムのテスト
- `dashboard.spec.ts` - ダッシュボードと基本機能のテスト
- `evaluations.spec.ts` - 評価システムのテスト
- `api.spec.ts` - API エンドポイントのテスト

### サポートファイル

- `auth/mock-auth.ts` - モック認証システム
- `setup/global-setup.ts` - テスト用データ準備

## テストの実行

### 基本的な実行

```bash
# 全テストを headless で実行
npm test

# ヘッド付きブラウザでテスト実行（デバッグ用）
npm run test:headed

# UI モードでテスト実行
npm run test:ui

# デバッグモードでテスト実行
npm run test:debug
```

### 特定のテストファイルの実行

```bash
# 評価システムのテストのみ実行
npx playwright test evaluations

# ダッシュボードのテストのみ実行
npx playwright test dashboard
```

### テスト結果の確認

```bash
# HTML レポートを開く
npx playwright show-report
```

## テスト用データ

### 自動生成されるデータ

テスト実行前に以下のデータが自動生成されます：

#### 組織とユーザー

- **テスト株式会社** (test-company)
- **管理者太郎** (admin@test.com) - ADMIN 権限
- **マネージャー花子** (manager@test.com) - MANAGER 権限
- **メンバー一郎** (member1@test.com) - MEMBER 権限
- **メンバー二郎** (member2@test.com) - MEMBER 権限
- **メンバー三郎** (member3@test.com) - MEMBER 権限

#### チーム

- **開発チーム** - マネージャー花子が管理
- 全メンバーが所属

#### 評価データ

- **2024年上期評価サイクル** (アクティブ)
- 4つの評価フェーズ：自己評価 → ピア評価 → 上司評価 → キャリブレーション
- 各メンバーの自己評価と上司評価（サンプル）
- デフォルトコンピテンシー（コミュニケーション、チームワーク、問題解決等）

#### その他のサンプルデータ

- Kudos（感謝のメッセージ）
- カスタマイズ可能なチェックイン（テンプレートベース）

### データのリセット

テスト実行前に既存のテストデータは自動的にクリアされ、新しいデータが生成されます。

## モック認証

### 認証の仕組み

テストでは実際の認証システムの代わりに、モック認証を使用します：

```typescript
import { mockAuth } from './auth/mock-auth';

// 管理者としてログイン
await mockAuth(page, 'admin');

// マネージャーとしてログイン
await mockAuth(page, 'manager');

// メンバーとしてログイン
await mockAuth(page, 'member');
```

### 利用可能なユーザータイプ

- `admin` - 全機能にアクセス可能
- `manager` - チーム管理、評価作成が可能
- `member` - 基本機能のみ利用可能

## テストの書き方

### 基本的なテスト構造

```typescript
import { test, expect } from '@playwright/test';
import { mockAuth } from './auth/mock-auth';

test.describe('機能名', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'admin');
  });

  test('テストケース名', async ({ page }) => {
    await page.goto('/path');

    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### レスポンシブテスト

```typescript
test('モバイルビューでの表示', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await mockAuth(page, 'admin');
  await page.goto('/dashboard');

  await expect(page.locator('h1')).toBeVisible();
});
```

### API のモック

```typescript
test('API エラーハンドリング', async ({ page }) => {
  await page.route('**/api/data', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'サーバーエラー' }),
    });
  });

  await page.goto('/page');
  // エラー処理の確認
});
```

## トラブルシューティング

### よくある問題

#### 1. ポート競合エラー

```bash
# 開発サーバーが別のポートで動いている場合
PORT=3001 npm run dev
```

#### 2. データベース接続エラー

```bash
# PostgreSQL が起動していることを確認
docker-compose ps
docker-compose up -d postgres
```

#### 3. テストがタイムアウトする

```bash
# タイムアウト時間を延長
npx playwright test --timeout=60000
```

### デバッグ方法

#### 1. ヘッド付きブラウザで実行

```bash
npm run test:headed
```

#### 2. 特定の行で一時停止

```typescript
test('デバッグテスト', async ({ page }) => {
  await page.pause(); // ここで一時停止
  await page.goto('/dashboard');
});
```

#### 3. スクリーンショットの確認

テスト失敗時のスクリーンショットは `test-results/` フォルダに保存されます。

## CI/CD での実行

### GitHub Actions での設定例

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run tests
  run: npm test

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-results
    path: test-results/
```

## パフォーマンス考慮事項

- テストは並列実行され、CI では worker を 1 つに制限
- headless モードがデフォルトで高速実行
- テスト用データは最小限に抑制
- 失敗時のみスクリーンショット/ビデオを記録

## 今後の拡張

- ビジュアル回帰テストの追加
- パフォーマンステストの実装
- モバイルデバイスでのテスト
- アクセシビリティテストの追加
