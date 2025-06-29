/**
 * チェックイン機能のストーリーベーステスト
 */

import { describeStory, testCriteria } from '../utils/story-test';
import { checkinStories } from '@/lib/user-stories/stories/checkin-stories';
import { expect } from '@playwright/test';
import { mockAuth } from '../auth/mock-auth';

// ストーリー: CHECKIN-001 - カスタマイズ可能なチェックインテンプレート
const templateManagementStory = checkinStories.find((s) => s.id === 'CHECKIN-001');
if (!templateManagementStory) throw new Error('Story CHECKIN-001 not found');

describeStory(templateManagementStory, () => {
  // AC-C001-1: テンプレート管理画面へのアクセス
  const criteria0 = templateManagementStory.acceptanceCriteria[0];
  if (criteria0) {
    testCriteria(criteria0, async ({ page }) => {
      // 管理者としてログイン
      await mockAuth(page, 'admin');

      // チェックインテンプレート管理画面にアクセス
      await page.goto('/ja/dashboard/checkins/templates');

      // テンプレート一覧と作成ボタンが表示される
      await expect(page.locator('h1:has-text("チェックインテンプレート管理")')).toBeVisible();
      await expect(page.locator('button:has-text("新しいテンプレート")')).toBeVisible();
    });
  }

  // AC-C001-2: テンプレート作成
  const criteria1 = templateManagementStory.acceptanceCriteria[1];
  if (criteria1) {
    testCriteria(criteria1, async ({ page }) => {
      await mockAuth(page, 'admin');
      await page.goto('/ja/dashboard/checkins/templates');

      // 新しいテンプレートボタンをクリック
      await page.locator('button:has-text("新しいテンプレート")').click();

      // テンプレート作成フォームが表示される
      await expect(page.locator('h2:has-text("新しいテンプレート")')).toBeVisible();

      // 基本情報を入力
      await page.fill('#name', 'カスタムテストテンプレート');
      await page.fill('#description', 'テスト用のカスタムテンプレート');

      // 頻度を選択
      await page.locator('[role="combobox"]').first().click();
      await page.locator('text=毎週').click();

      // 質問を追加
      await page.locator('button:has-text("質問を追加")').click();
      await page.fill('input[placeholder="質問を入力してください"]', 'テスト質問');

      // 保存
      await page.locator('button:has-text("保存")').click();

      // 成功メッセージまたは一覧に戻ることを確認
      await expect(page.locator('h1:has-text("チェックインテンプレート管理")')).toBeVisible();
    });
  }

  // AC-C001-3: デフォルトテンプレート作成
  const criteria2 = templateManagementStory.acceptanceCriteria[2];
  if (criteria2) {
    testCriteria(criteria2, async ({ page }) => {
      await mockAuth(page, 'admin');
      await page.goto('/ja/dashboard/checkins');

      // テンプレートが存在しない場合のメッセージを確認
      await expect(page.locator('text=テンプレートが設定されていません')).toBeVisible();

      // デフォルトテンプレート作成ボタンをクリック
      await page.locator('button:has-text("デフォルトテンプレートを作成")').click();

      // ページがリロードされ、チェックインフォームが表示される
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=カスタムチェックイン')).toBeVisible();
    });
  }
});

// ストーリー: CHECKIN-002 - テンプレートベースのチェックイン作成
const checkinCreationStory = checkinStories.find((s) => s.id === 'CHECKIN-002');
if (!checkinCreationStory) throw new Error('Story CHECKIN-002 not found');

describeStory(checkinCreationStory, () => {
  // AC-C002-1: テンプレートフォーム表示
  const criteria3 = checkinCreationStory.acceptanceCriteria[0];
  if (criteria3) {
    testCriteria(criteria3, async ({ page }) => {
      // 一般従業員としてログイン
      await mockAuth(page, 'member');

      // チェックインページにアクセス
      await page.goto('/ja/dashboard/checkins');

      // テンプレート選択とフォームが表示される
      await expect(page.locator('text=カスタムチェックイン')).toBeVisible();
      await expect(page.locator('text=テンプレート選択')).toBeVisible();
    });
  }

  // AC-C002-2: チェックイン送信
  const criteria4 = checkinCreationStory.acceptanceCriteria[1];
  if (criteria4) {
    testCriteria(criteria4, async ({ page }) => {
      await mockAuth(page, 'member');
      await page.goto('/ja/dashboard/checkins');

      // テンプレートが選択されていることを確認
      await expect(page.locator('[role="combobox"]')).toBeVisible();

      // 質問に回答
      const textareas = page.locator('textarea');
      await textareas.first().fill('今週は新機能の開発を完了しました');
      await textareas.nth(1).fill('来週はテストケースの強化に取り組みます');

      // 気分評価を選択
      await page.locator('input[value="4"]').check();

      // 送信
      await page.locator('button:has-text("チェックイン完了")').click();

      // 成功メッセージを確認
      await expect(page.locator('text=チェックインを完了しました')).toBeVisible();
    });
  }

  // AC-C002-3: テンプレート切り替え
  const criteria5 = checkinCreationStory.acceptanceCriteria[2];
  if (criteria5) {
    testCriteria(criteria5, async ({ page }) => {
      await mockAuth(page, 'member');
      await page.goto('/ja/dashboard/checkins');

      // 初期テンプレートの質問を確認
      const initialQuestions = await page.locator('label').allTextContents();

      // 別のテンプレートを選択（複数ある場合）
      await page.locator('[role="combobox"]').click();
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();

      if (optionCount > 1) {
        await options.nth(1).click();

        // 質問が変更されたことを確認
        const newQuestions = await page.locator('label').allTextContents();
        expect(newQuestions).not.toEqual(initialQuestions);
      }
    });
  }
});

// ストーリー: CHECKIN-003 - チェックイン履歴とインサイト
const historyStory = checkinStories.find((s) => s.id === 'CHECKIN-003');
if (!historyStory) throw new Error('Story CHECKIN-003 not found');

describeStory(historyStory, () => {
  // AC-C003-1: 履歴表示
  const criteria6 = historyStory.acceptanceCriteria[0];
  if (criteria6) {
    testCriteria(criteria6, async ({ page }) => {
      await mockAuth(page, 'member');
      await page.goto('/ja/dashboard/checkins');

      // 履歴セクションを確認
      await expect(page.locator('text=チェックイン履歴')).toBeVisible();
      await expect(page.locator('text=統計')).toBeVisible();
    });
  }

  // AC-C003-2: 統計情報表示
  const criteria7 = historyStory.acceptanceCriteria[1];
  if (criteria7) {
    testCriteria(criteria7, async ({ page }) => {
      await mockAuth(page, 'member');
      await page.goto('/ja/dashboard/checkins');

      // 統計情報を確認
      await expect(page.locator('text=総チェックイン数')).toBeVisible();
      await expect(page.locator('text=平均気分スコア')).toBeVisible();
    });
  }

  // AC-C003-3: 履歴詳細表示
  const criteria8 = historyStory.acceptanceCriteria[2];
  if (criteria8) {
    testCriteria(criteria8, async ({ page }) => {
      await mockAuth(page, 'member');
      await page.goto('/ja/dashboard/checkins');

      // 履歴エントリが存在する場合
      const historyItems = page.locator('[data-testid="checkin-history-item"]');
      const itemCount = await historyItems.count();

      if (itemCount > 0) {
        // 最初のエントリでテンプレート情報と回答が表示されることを確認
        const firstItem = historyItems.first();
        await expect(firstItem.locator('text=スタンダード週次チェックイン')).toBeVisible();
        await expect(firstItem.locator('text=毎週')).toBeVisible();
      }
    });
  }
});
