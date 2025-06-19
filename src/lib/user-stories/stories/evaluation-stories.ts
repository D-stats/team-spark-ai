/**
 * 評価機能のユーザーストーリー
 */

import { UserStory, StoryPriority, StoryStatus } from '../types';

export const evaluationStories: UserStory[] = [
  {
    id: 'EVAL-001',
    epicId: 'EPIC-EVALUATION',
    title: '自己評価の入力',
    asA: '従業員',
    iWantTo: '自分の成果と改善点を記録したい',
    soThat: '上司と建設的な評価面談ができる',
    acceptanceCriteria: [
      {
        id: 'AC-001-1',
        given: 'アクティブな評価サイクルが存在する',
        when: '評価ページにアクセスする',
        then: '自己評価フォームが表示される',
        verified: true,
        testIds: ['evaluation-form.spec.ts#access-form'],
      },
      {
        id: 'AC-001-2',
        given: '評価フォームが表示されている',
        when: '総合評価とコメントを入力する',
        then: '入力内容が自動保存される',
        verified: true,
        testIds: ['evaluation-form.spec.ts#auto-save'],
      },
      {
        id: 'AC-001-3',
        given: '必須項目をすべて入力した',
        when: '送信ボタンをクリックする',
        then: '評価が提出され、確認メッセージが表示される',
        verified: true,
        testIds: ['evaluation-form.spec.ts#submit'],
      },
    ],
    priority: StoryPriority.P0,
    status: StoryStatus.DONE,
    tags: ['評価', '自己評価', 'MVP'],
    implementedIn: {
      components: [
        '/src/components/evaluations/evaluation-form.tsx',
        '/src/components/evaluations/form-steps/overview-step.tsx',
      ],
      apis: [
        '/src/app/api/evaluations/[id]/route.ts',
        '/src/app/api/evaluations/[id]/submit/route.ts',
      ],
      tests: [
        '/tests/e2e/evaluation-basic.spec.ts',
      ],
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    completedAt: new Date('2024-01-15'),
  },
  {
    id: 'EVAL-002',
    epicId: 'EPIC-EVALUATION',
    title: '部下の評価レビュー',
    asA: 'マネージャー',
    iWantTo: '部下の評価を確認・承認したい',
    soThat: '公正で一貫性のある評価ができる',
    acceptanceCriteria: [
      {
        id: 'AC-002-1',
        given: '部下が評価を提出済み',
        when: '評価一覧ページにアクセスする',
        then: 'レビュー待ちの評価が表示される',
        verified: true,
        testIds: ['manager-review.spec.ts#list-pending'],
      },
      {
        id: 'AC-002-2',
        given: '評価詳細を開いている',
        when: '承認ボタンをクリックする',
        then: '評価が承認され、通知が送信される',
        verified: true,
        testIds: ['manager-review.spec.ts#approve'],
      },
      {
        id: 'AC-002-3',
        given: '評価詳細を開いている',
        when: '差し戻しボタンをクリックしてコメントを入力',
        then: '評価が差し戻され、理由が従業員に通知される',
        verified: true,
        testIds: ['manager-review.spec.ts#reject'],
      },
    ],
    priority: StoryPriority.P0,
    status: StoryStatus.DONE,
    tags: ['評価', 'マネージャー', '承認フロー'],
    implementedIn: {
      components: [
        '/src/components/evaluations/evaluation-results.tsx',
      ],
      apis: [
        '/src/app/api/evaluations/[id]/review/route.ts',
      ],
      tests: [
        '/tests/e2e/evaluation-review.spec.ts',
      ],
    },
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-18'),
    completedAt: new Date('2024-01-18'),
  },
  {
    id: 'EVAL-003',
    epicId: 'EPIC-EVALUATION',
    title: 'キャリブレーション会議',
    asA: '人事責任者',
    iWantTo: '全社の評価分布を調整したい',
    soThat: '公平性を保ちながら適切な評価分布を実現できる',
    acceptanceCriteria: [
      {
        id: 'AC-003-1',
        given: 'すべての評価が提出済み',
        when: 'キャリブレーション画面を開く',
        then: '評価分布グラフと調整機能が表示される',
        verified: false,
        testIds: [],
      },
      {
        id: 'AC-003-2',
        given: '評価分布を確認している',
        when: '特定の評価を調整する',
        then: 'リアルタイムで分布が更新される',
        verified: false,
        testIds: [],
      },
    ],
    priority: StoryPriority.P1,
    status: StoryStatus.READY,
    tags: ['評価', 'キャリブレーション', '管理者'],
    implementedIn: {},
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
];

// Kudos機能のストーリー
export const kudosStories: UserStory[] = [
  {
    id: 'KUDOS-001',
    epicId: 'EPIC-ENGAGEMENT',
    title: 'Slackでの称賛送信',
    asA: '従業員',
    iWantTo: 'Slackから同僚に感謝を伝えたい',
    soThat: 'タイムリーに認識を示せる',
    acceptanceCriteria: [
      {
        id: 'AC-K001-1',
        given: 'Slackワークスペースに参加している',
        when: '/kudos コマンドを実行する',
        then: 'Kudos送信フォームが表示される',
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
      apis: [
        '/src/app/api/slack/commands/kudos/route.ts',
      ],
      tests: [
        '/tests/integration/slack-kudos.test.ts',
      ],
    },
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2023-12-20'),
    completedAt: new Date('2023-12-20'),
  },
];