import { loadTestEnv } from './test-env';
import { prisma } from '../../../src/lib/prisma';
import { createDefaultCompetencies } from '../../../src/services/evaluation.service';

interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  organizationId: string;
}

interface TestOrganization {
  id: string;
  name: string;
  slug: string;
}

// テストデータの作成
export async function setupTestData() {
  console.log('Setting up test data...');
  
  try {
    // 既存のテストデータをクリア
    await clearTestData();
    
    // テスト用組織の作成
    const organization = await prisma.organization.create({
      data: {
        name: 'テスト株式会社',
        slug: 'test-company',
      },
    });
    
    // テスト用ユーザーの作成
    const users = await Promise.all([
      // 管理者
      prisma.user.create({
        data: {
          email: 'admin@test.com',
          name: '管理者太郎',
          role: 'ADMIN',
          organizationId: organization.id,
        },
      }),
      // マネージャー
      prisma.user.create({
        data: {
          email: 'manager@test.com',
          name: 'マネージャー花子',
          role: 'MANAGER',
          organizationId: organization.id,
        },
      }),
      // メンバー
      prisma.user.create({
        data: {
          email: 'member1@test.com',
          name: 'メンバー一郎',
          role: 'MEMBER',
          organizationId: organization.id,
        },
      }),
      prisma.user.create({
        data: {
          email: 'member2@test.com',
          name: 'メンバー二郎',
          role: 'MEMBER',
          organizationId: organization.id,
        },
      }),
      prisma.user.create({
        data: {
          email: 'member3@test.com',
          name: 'メンバー三郎',
          role: 'MEMBER',
          organizationId: organization.id,
        },
      }),
    ]);
    
    const [admin, manager, member1, member2, member3] = users;
    
    // テスト用チームの作成
    const team = await prisma.team.create({
      data: {
        name: '開発チーム',
        description: 'プロダクト開発を担当するチーム',
        organizationId: organization.id,
        managerId: manager.id,
      },
    });
    
    // チームメンバーの追加
    await Promise.all([
      prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: manager.id,
        },
      }),
      prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: member1.id,
        },
      }),
      prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: member2.id,
        },
      }),
      prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: member3.id,
        },
      }),
    ]);
    
    // デフォルトコンピテンシーの作成
    await createDefaultCompetencies(organization.id);
    
    // テスト用評価サイクルの作成
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 今月の1日
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // 今月末
    
    const evaluationCycle = await prisma.evaluationCycle.create({
      data: {
        name: '2024年上期評価',
        type: 'SEMI_ANNUAL',
        startDate,
        endDate,
        status: 'ACTIVE',
        organizationId: organization.id,
        phases: {
          create: [
            {
              type: 'SELF',
              name: '自己評価',
              description: '自己の成果と成長を振り返る',
              startDate,
              endDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 1週間後
              order: 1,
            },
            {
              type: 'PEER',
              name: 'ピア評価',
              description: '同僚からのフィードバック',
              startDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
              endDate: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 2週間後
              order: 2,
            },
            {
              type: 'MANAGER',
              name: '上司評価',
              description: '上司による評価とフィードバック',
              startDate: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000),
              endDate: new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000), // 3週間後
              order: 3,
            },
            {
              type: 'CALIBRATION',
              name: 'キャリブレーション',
              description: '評価の調整と最終化',
              startDate: new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000),
              endDate,
              order: 4,
            },
          ],
        },
      },
    });
    
    // 評価の作成（自動生成される評価をシミュレート）
    const competencies = await prisma.competency.findMany({
      where: { organizationId: organization.id },
    });
    
    // 各メンバーの評価を作成
    for (const evaluatee of [member1, member2, member3]) {
      // 自己評価
      const selfEvaluation = await prisma.evaluation.create({
        data: {
          cycleId: evaluationCycle.id,
          evaluateeId: evaluatee.id,
          evaluatorId: evaluatee.id,
          type: 'SELF',
          overallRating: Math.floor(Math.random() * 2) + 4, // 4-5のランダム
          overallComments: '今期は新しい技術への取り組みと、チームとの連携を重視して業務に取り組みました。',
          strengths: '新技術の習得が早く、チームメンバーとのコミュニケーションが円滑です。',
          improvements: 'プロジェクト管理スキルをさらに向上させたいと思います。',
          careerGoals: 'リードエンジニアとしてチーム全体の技術力向上に貢献したいです。',
          developmentPlan: '来期はプロジェクト管理研修を受講し、より効率的な開発プロセスを学びたいです。',
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
      
      // コンピテンシー評価の追加
      for (const competency of competencies.slice(0, 3)) {
        await prisma.competencyRating.create({
          data: {
            evaluationId: selfEvaluation.id,
            competencyId: competency.id,
            rating: Math.floor(Math.random() * 2) + 4, // 4-5のランダム
            evidence: `${competency.name}において、具体的な成果や行動例を示すことができます。`,
          },
        });
      }
      
      // マネージャー評価
      const managerEvaluation = await prisma.evaluation.create({
        data: {
          cycleId: evaluationCycle.id,
          evaluateeId: evaluatee.id,
          evaluatorId: manager.id,
          type: 'MANAGER',
          overallRating: Math.floor(Math.random() * 2) + 3, // 3-4のランダム
          overallComments: 'チームの一員として着実に成長しており、期待を上回る成果を上げています。',
          strengths: '技術力が高く、チームメンバーからの信頼も厚いです。',
          improvements: 'リーダーシップをより発揮して、チーム全体を牽引してほしいです。',
          careerGoals: '次期リーダー候補として、マネジメントスキルの習得が期待されます。',
          developmentPlan: 'リーダーシップ研修とメンタリングプログラムへの参加を推奨します。',
          status: 'REVIEWED',
          submittedAt: new Date(),
          reviewedAt: new Date(),
          reviewedBy: admin.id,
        },
      });
      
      // マネージャー評価のコンピテンシー評価
      for (const competency of competencies.slice(0, 3)) {
        await prisma.competencyRating.create({
          data: {
            evaluationId: managerEvaluation.id,
            competencyId: competency.id,
            rating: Math.floor(Math.random() * 2) + 3, // 3-4のランダム
            evidence: `管理者視点から見た${competency.name}に関する具体的な観察と評価です。`,
          },
        });
      }
    }
    
    // サンプルKudosの作成
    await Promise.all([
      prisma.kudos.create({
        data: {
          senderId: manager.id,
          receiverId: member1.id,
          message: '新機能の実装、お疲れ様でした！品質の高いコードでチーム全体の生産性が向上しました。',
          category: 'INNOVATION',
          points: 3,
        },
      }),
      prisma.kudos.create({
        data: {
          senderId: member2.id,
          receiverId: member3.id,
          message: 'バグ修正での迅速な対応、ありがとうございました！',
          category: 'PROBLEM_SOLVING',
          points: 2,
        },
      }),
    ]);
    
    // サンプルチェックインの作成
    for (const user of [member1, member2, member3]) {
      await prisma.checkIn.create({
        data: {
          userId: user.id,
          achievements: '新機能の開発を完了し、テストも無事通過しました。',
          nextWeekGoals: '次のスプリントで予定されているリファクタリングに取り組みます。',
          moodRating: Math.floor(Math.random() * 2) + 4, // 4-5のランダム
          challenges: '一部の技術的な課題で時間がかかりましたが、チームの協力で解決できました。',
        },
      });
    }
    
    console.log('Test data setup completed successfully!');
    
    return {
      organization,
      users: {
        admin,
        manager,
        member1,
        member2,
        member3,
      },
      team,
      evaluationCycle,
    };
  } catch (error) {
    console.error('Error setting up test data:', error);
    throw error;
  }
}

// テストデータのクリア
export async function clearTestData() {
  console.log('Clearing existing test data...');
  
  try {
    // 外部キー制約を考慮した順序でデータを削除
    await prisma.competencyRating.deleteMany({});
    await prisma.evaluation.deleteMany({});
    await prisma.evaluationPhase.deleteMany({});
    await prisma.evaluationCycle.deleteMany({});
    await prisma.competency.deleteMany({});
    await prisma.checkIn.deleteMany({});
    await prisma.kudos.deleteMany({});
    await prisma.teamMember.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    
    console.log('Test data cleared successfully!');
  } catch (error) {
    console.error('Error clearing test data:', error);
    throw error;
  }
}

// グローバルセットアップ
export default async function globalSetup() {
  console.log('Running global setup...');
  
  // 環境変数を読み込む
  loadTestEnv();
  
  await setupTestData();
}