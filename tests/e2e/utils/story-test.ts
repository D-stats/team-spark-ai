/**
 * ユーザーストーリーベースのテストヘルパー
 */

import { test as base, expect, type Page } from '@playwright/test';
import { UserStory, AcceptanceCriteria } from '@/lib/user-stories/types';

// カスタムテストフィクスチャ
export const storyTest = base.extend<{
  story: UserStory | null;
  criteria: AcceptanceCriteria | null;
}>({
  story: null,
  criteria: null,
});

// ストーリーベースのテストを定義
export function describeStory(story: UserStory, testFn: () => void) {
  storyTest.describe(`[${story.id}] ${story.title}`, () => {
    storyTest.describe.configure({ mode: 'serial' });

    storyTest.beforeEach(async ({}, testInfo) => {
      // テスト情報にストーリーIDを追加
      testInfo.annotations.push({
        type: 'story',
        description: story.id,
      });
    });

    // ストーリーのコンテキストを表示
    storyTest(
      `ストーリー: As a ${story.asA}, I want to ${story.iWantTo}`,
      async ({ page: _page }) => {
        // このテストは情報表示のみ
        console.log(`So that ${story.soThat}`);
        expect(true).toBe(true);
      },
    );

    testFn();
  });
}

export function testCriteria(
  criteria: AcceptanceCriteria,
  testImplementation: (args: { page: Page }) => Promise<void>,
) {
  storyTest(`✓ Given: ${criteria.given}`, async ({ page }, testInfo) => {
    // テスト情報に基準IDを追加
    testInfo.annotations.push({
      type: 'criteria',
      description: criteria.id,
    });

    console.log(`When: ${criteria.when}`);
    console.log(`Then: ${criteria.then}`);

    await testImplementation({ page });
  });
}

// ストーリーの実装状況をマーク
export function markStoryImplemented(
  storyId: string,
  implementation: {
    component?: string;
    api?: string;
    test?: string;
  },
) {
  return storyTest(`Implementation: ${storyId}`, async ({}, testInfo) => {
    testInfo.annotations.push({
      type: 'implementation',
      description: JSON.stringify({
        storyId,
        ...implementation,
      }),
    });
    expect(true).toBe(true);
  });
}

// テスト結果とストーリーを関連付けるレポーター
export class StoryReporter {
  private results: Map<string, boolean> = new Map();

  onTestEnd(
    test: { annotations: Array<{ type: string; description: string }> },
    result: { status: string },
  ) {
    const storyAnnotation = test.annotations.find((a) => a.type === 'story');
    const criteriaAnnotation = test.annotations.find((a) => a.type === 'criteria');

    if (storyAnnotation && criteriaAnnotation) {
      const key = `${storyAnnotation.description}:${criteriaAnnotation.description}`;
      this.results.set(key, result.status === 'passed');
    }
  }

  generateReport(): Record<string, Record<string, boolean>> {
    const report: Record<string, Record<string, boolean>> = {};

    this.results.forEach((passed, key) => {
      const [storyId, criteriaId] = key.split(':');
      if (storyId && criteriaId) {
        if (!report[storyId]) {
          report[storyId] = {};
        }
        report[storyId][criteriaId] = passed;
      }
    });

    return report;
  }
}
