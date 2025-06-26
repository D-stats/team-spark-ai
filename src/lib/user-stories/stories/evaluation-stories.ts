/**
 * User stories for evaluation features
 */

import { UserStory, StoryPriority, StoryStatus } from '../types';

export const evaluationStories: UserStory[] = [
  {
    id: 'EVAL-001',
    epicId: 'EPIC-EVALUATION',
    title: 'Self-evaluation input',
    asA: 'Employee',
    iWantTo: 'Record my achievements and areas for improvement',
    soThat: 'I can have a constructive evaluation discussion with my supervisor',
    acceptanceCriteria: [
      {
        id: 'AC-001-1',
        given: 'An active evaluation cycle exists',
        when: 'I access the evaluation page',
        then: 'The self-evaluation form is displayed',
        verified: true,
        testIds: ['evaluation-form.spec.ts#access-form'],
      },
      {
        id: 'AC-001-2',
        given: 'The evaluation form is displayed',
        when: 'I enter overall rating and comments',
        then: 'The input is automatically saved',
        verified: true,
        testIds: ['evaluation-form.spec.ts#auto-save'],
      },
      {
        id: 'AC-001-3',
        given: 'All required fields are filled',
        when: 'I click the submit button',
        then: 'The evaluation is submitted and a confirmation message is displayed',
        verified: true,
        testIds: ['evaluation-form.spec.ts#submit'],
      },
    ],
    priority: StoryPriority.P0,
    status: StoryStatus.DONE,
    tags: ['evaluation', 'self-evaluation', 'MVP'],
    implementedIn: {
      components: [
        '/src/components/evaluations/evaluation-form.tsx',
        '/src/components/evaluations/form-steps/overview-step.tsx',
      ],
      apis: [
        '/src/app/api/evaluations/[id]/route.ts',
        '/src/app/api/evaluations/[id]/submit/route.ts',
      ],
      tests: ['/tests/e2e/evaluation-basic.spec.ts'],
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    completedAt: new Date('2024-01-15'),
  },
  {
    id: 'EVAL-002',
    epicId: 'EPIC-EVALUATION',
    title: 'Subordinate evaluation review',
    asA: 'Manager',
    iWantTo: 'Review and approve subordinate evaluations',
    soThat: 'I can ensure fair and consistent evaluations',
    acceptanceCriteria: [
      {
        id: 'AC-002-1',
        given: 'Subordinate has submitted evaluation',
        when: 'I access the evaluation list page',
        then: 'Pending evaluations are displayed for review',
        verified: true,
        testIds: ['manager-review.spec.ts#list-pending'],
      },
      {
        id: 'AC-002-2',
        given: 'I have reviewed the evaluation details',
        when: 'I click the approve button',
        then: 'The evaluation is approved and notification is sent',
        verified: true,
        testIds: ['manager-review.spec.ts#approve'],
      },
      {
        id: 'AC-002-3',
        given: 'I have determined that corrections are needed',
        when: 'I click the return button and enter comments',
        then: 'The evaluation is returned and the reason is notified to the employee',
        verified: true,
        testIds: ['manager-review.spec.ts#reject'],
      },
    ],
    priority: StoryPriority.P0,
    status: StoryStatus.DONE,
    tags: ['evaluation', 'manager', 'approval-flow'],
    implementedIn: {
      components: ['/src/components/evaluations/evaluation-results.tsx'],
      apis: ['/src/app/api/evaluations/[id]/review/route.ts'],
      tests: ['/tests/e2e/evaluation-review.spec.ts'],
    },
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-18'),
    completedAt: new Date('2024-01-18'),
  },
  {
    id: 'EVAL-003',
    epicId: 'EPIC-EVALUATION',
    title: 'Calibration meeting',
    asA: 'HR Manager',
    iWantTo: 'Adjust company-wide evaluation distribution',
    soThat: 'I can achieve appropriate evaluation distribution while maintaining fairness',
    acceptanceCriteria: [
      {
        id: 'AC-003-1',
        given: 'All evaluations have been submitted',
        when: 'I open the calibration screen',
        then: 'Evaluation distribution graph and adjustment functions are displayed',
        verified: false,
        testIds: [],
      },
      {
        id: 'AC-003-2',
        given: 'I am reviewing the evaluation distribution',
        when: 'I adjust specific evaluations',
        then: 'The distribution updates in real-time',
        verified: false,
        testIds: [],
      },
    ],
    priority: StoryPriority.P1,
    status: StoryStatus.READY,
    tags: ['evaluation', 'calibration', 'admin'],
    implementedIn: {},
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
];

// Kudos feature stories
export const kudosStories: UserStory[] = [
  {
    id: 'KUDOS-001',
    epicId: 'EPIC-ENGAGEMENT',
    title: 'Send kudos via Slack',
    asA: 'Employee',
    iWantTo: 'Express gratitude to colleagues through Slack',
    soThat: 'I can show recognition in a timely manner',
    acceptanceCriteria: [
      {
        id: 'AC-K001-1',
        given: 'I am in the Slack workspace',
        when: 'I execute the /kudos command',
        then: 'The Kudos submission form is displayed',
        verified: true,
        testIds: ['slack-kudos.spec.ts#command'],
      },
      {
        id: 'AC-K001-2',
        given: 'フォームに必要事項を入力した',
        when: '送信ボタンをクリックする',
        then: '受信者に通知が届き、ポイントが付与される',
        verified: true,
        testIds: ['slack-kudos.spec.ts#send'],
      },
    ],
    priority: StoryPriority.P1,
    status: StoryStatus.DONE,
    tags: ['エンゲージメント', 'Slack', 'MVP'],
    implementedIn: {
      components: [],
      apis: ['/src/app/api/slack/commands/kudos/route.ts'],
      tests: ['/tests/integration/slack-kudos.test.ts'],
    },
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2023-12-20'),
    completedAt: new Date('2023-12-20'),
  },
];
