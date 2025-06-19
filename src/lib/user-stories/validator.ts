/**
 * ユーザーストーリー検証エンジン
 */

import { UserStory, StoryValidation, StoryStatus } from './types';
import { existsSync } from 'fs';
import path from 'path';

export class StoryValidator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * 単一のストーリーを検証
   */
  validateStory(story: UserStory): StoryValidation {
    const validation: StoryValidation = {
      storyId: story.id,
      isValid: true,
      completedCriteria: 0,
      totalCriteria: story.acceptanceCriteria.length,
      missingImplementation: [],
      testCoverage: 0,
    };

    // 受け入れ基準の検証
    story.acceptanceCriteria.forEach(criteria => {
      if (criteria.verified) {
        validation.completedCriteria++;
      }
    });

    // 実装ファイルの存在確認
    if (story.implementedIn) {
      // コンポーネントの確認
      story.implementedIn.components?.forEach(component => {
        const fullPath = path.join(this.projectRoot, component);
        if (!existsSync(fullPath)) {
          validation.missingImplementation.push(`Component: ${component}`);
          validation.isValid = false;
        }
      });

      // APIの確認
      story.implementedIn.apis?.forEach(api => {
        const fullPath = path.join(this.projectRoot, api);
        if (!existsSync(fullPath)) {
          validation.missingImplementation.push(`API: ${api}`);
          validation.isValid = false;
        }
      });

      // テストの確認
      story.implementedIn.tests?.forEach(test => {
        const fullPath = path.join(this.projectRoot, test);
        if (!existsSync(fullPath)) {
          validation.missingImplementation.push(`Test: ${test}`);
          validation.isValid = false;
        }
      });
    }

    // テストカバレッジの計算
    const totalTests = story.acceptanceCriteria.reduce(
      (sum, criteria) => sum + (criteria.testIds?.length || 0),
      0
    );
    const verifiedTests = story.acceptanceCriteria.reduce(
      (sum, criteria) => sum + (criteria.verified && criteria.testIds?.length || 0),
      0
    );
    validation.testCoverage = totalTests > 0 ? (verifiedTests / totalTests) * 100 : 0;

    // 全体的な検証
    validation.isValid = validation.isValid && 
                        validation.completedCriteria === validation.totalCriteria &&
                        validation.missingImplementation.length === 0 &&
                        story.status === StoryStatus.DONE;

    return validation;
  }

  /**
   * 複数のストーリーを検証
   */
  validateStories(stories: UserStory[]): {
    summary: {
      total: number;
      valid: number;
      invalid: number;
      coverage: number;
    };
    details: StoryValidation[];
  } {
    const details = stories.map(story => this.validateStory(story));
    const valid = details.filter(v => v.isValid).length;
    const totalCoverage = details.reduce((sum, v) => sum + v.testCoverage, 0);

    return {
      summary: {
        total: stories.length,
        valid,
        invalid: stories.length - valid,
        coverage: stories.length > 0 ? totalCoverage / stories.length : 0,
      },
      details,
    };
  }

  /**
   * ストーリーの実装状況をレポート
   */
  generateReport(stories: UserStory[]): string {
    const validation = this.validateStories(stories);
    const report: string[] = [
      '# ユーザーストーリー検証レポート',
      '',
      `生成日時: ${new Date().toISOString()}`,
      '',
      '## サマリー',
      `- 総ストーリー数: ${validation.summary.total}`,
      `- ✅ 完了: ${validation.summary.valid}`,
      `- ❌ 未完了: ${validation.summary.invalid}`,
      `- 📊 平均テストカバレッジ: ${validation.summary.coverage.toFixed(1)}%`,
      '',
      '## 詳細',
      '',
    ];

    validation.details.forEach((detail, index) => {
      const story = stories[index];
      const status = detail.isValid ? '✅' : '❌';
      
      report.push(`### ${status} ${story.id}: ${story.title}`);
      report.push(`**As a** ${story.asA}`);
      report.push(`**I want to** ${story.iWantTo}`);
      report.push(`**So that** ${story.soThat}`);
      report.push('');
      report.push(`- ステータス: ${story.status}`);
      report.push(`- 優先度: ${story.priority}`);
      report.push(`- 受け入れ基準: ${detail.completedCriteria}/${detail.totalCriteria} 完了`);
      report.push(`- テストカバレッジ: ${detail.testCoverage.toFixed(1)}%`);
      
      if (detail.missingImplementation.length > 0) {
        report.push('- ⚠️ 不足している実装:');
        detail.missingImplementation.forEach(missing => {
          report.push(`  - ${missing}`);
        });
      }
      
      report.push('');
    });

    return report.join('\n');
  }
}

// CLIツール用のヘルパー関数
export async function validateAllStories(): Promise<void> {
  const validator = new StoryValidator();
  
  // すべてのストーリーをインポート
  const { evaluationStories, kudosStories } = await import('./stories/evaluation-stories');
  const allStories = [...evaluationStories, ...kudosStories];
  
  const report = validator.generateReport(allStories);
  console.log(report);
  
  // レポートファイルとして保存
  const fs = await import('fs/promises');
  await fs.writeFile(
    path.join(process.cwd(), 'user-story-validation-report.md'),
    report,
    'utf-8'
  );
}