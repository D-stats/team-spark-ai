/**
 * User story validation engine
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
   * Validate a single story
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

    // Validate acceptance criteria
    story.acceptanceCriteria.forEach(criteria => {
      if (criteria.verified) {
        validation.completedCriteria++;
      }
    });

    // Check implementation file existence
    if (story.implementedIn) {
      // Check components
      story.implementedIn.components?.forEach(component => {
        const fullPath = path.join(this.projectRoot, component);
        if (!existsSync(fullPath)) {
          validation.missingImplementation.push(`Component: ${component}`);
          validation.isValid = false;
        }
      });

      // Check APIs
      story.implementedIn.apis?.forEach(api => {
        const fullPath = path.join(this.projectRoot, api);
        if (!existsSync(fullPath)) {
          validation.missingImplementation.push(`API: ${api}`);
          validation.isValid = false;
        }
      });

      // Check tests
      story.implementedIn.tests?.forEach(test => {
        const fullPath = path.join(this.projectRoot, test);
        if (!existsSync(fullPath)) {
          validation.missingImplementation.push(`Test: ${test}`);
          validation.isValid = false;
        }
      });
    }

    // Calculate test coverage
    const totalTests = story.acceptanceCriteria.reduce(
      (sum, criteria) => sum + (criteria.testIds?.length || 0),
      0
    );
    const verifiedTests = story.acceptanceCriteria.reduce(
      (sum, criteria) => sum + (criteria.verified && criteria.testIds?.length || 0),
      0
    );
    validation.testCoverage = totalTests > 0 ? (verifiedTests / totalTests) * 100 : 0;

    // Overall validation
    validation.isValid = validation.isValid && 
                        validation.completedCriteria === validation.totalCriteria &&
                        validation.missingImplementation.length === 0 &&
                        story.status === StoryStatus.DONE;

    return validation;
  }

  /**
   * Validate multiple stories
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
   * Generate implementation status report for stories
   */
  generateReport(stories: UserStory[]): string {
    const validation = this.validateStories(stories);
    const report: string[] = [
      '# User Story Validation Report',
      '',
      `Generated at: ${new Date().toISOString()}`,
      '',
      '## Summary',
      `- Total stories: ${validation.summary.total}`,
      `- ✅ Completed: ${validation.summary.valid}`,
      `- ❌ Incomplete: ${validation.summary.invalid}`,
      `- 📊 Average test coverage: ${validation.summary.coverage.toFixed(1)}%`,
      '',
      '## Details',
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
      report.push(`- Status: ${story.status}`);
      report.push(`- Priority: ${story.priority}`);
      report.push(`- Acceptance criteria: ${detail.completedCriteria}/${detail.totalCriteria} completed`);
      report.push(`- Test coverage: ${detail.testCoverage.toFixed(1)}%`);
      
      if (detail.missingImplementation.length > 0) {
        report.push('- ⚠️ Missing implementation:');
        detail.missingImplementation.forEach(missing => {
          report.push(`  - ${missing}`);
        });
      }
      
      report.push('');
    });

    return report.join('\n');
  }
}

// Helper function for CLI tool
export async function validateAllStories(): Promise<void> {
  const validator = new StoryValidator();
  
  // Import all stories
  const { evaluationStories, kudosStories } = await import('./stories/evaluation-stories');
  const allStories = [...evaluationStories, ...kudosStories];
  
  const report = validator.generateReport(allStories);
  console.log(report);
  
  // Save as report file
  const fs = await import('fs/promises');
  await fs.writeFile(
    path.join(process.cwd(), 'user-story-validation-report.md'),
    report,
    'utf-8'
  );
}