import { loadTestEnv } from './test-env';
import { prisma } from '../../../src/lib/prisma';
import { createDefaultCompetencies } from '../../../src/services/evaluation.service';

// Removed unused interfaces as they are not needed in this setup file

// Create test data
export async function setupTestData() {
  console.log('Setting up test data...');

  try {
    // Clear existing test data
    await clearTestData();

    // Create test organization
    const organization = await prisma.organization.create({
      data: {
        name: 'Test Company',
        slug: 'test-company',
      },
    });

    // Create test users
    const users = await Promise.all([
      // Administrator
      prisma.user.create({
        data: {
          email: 'admin@test.com',
          name: 'Admin User',
          role: 'ADMIN',
          organizationId: organization.id,
        },
      }),
      // Manager
      prisma.user.create({
        data: {
          email: 'manager@test.com',
          name: 'Manager User',
          role: 'MANAGER',
          organizationId: organization.id,
        },
      }),
      // Member
      prisma.user.create({
        data: {
          email: 'member1@test.com',
          name: 'Member One',
          role: 'MEMBER',
          organizationId: organization.id,
        },
      }),
      prisma.user.create({
        data: {
          email: 'member2@test.com',
          name: 'Member Two',
          role: 'MEMBER',
          organizationId: organization.id,
        },
      }),
      prisma.user.create({
        data: {
          email: 'member3@test.com',
          name: 'Member Three',
          role: 'MEMBER',
          organizationId: organization.id,
        },
      }),
    ]);

    const [admin, manager, member1, member2, member3] = users;

    // Create test team
    const team = await prisma.team.create({
      data: {
        name: 'Development Team',
        description: 'Team responsible for product development',
        organizationId: organization.id,
        managerId: manager.id,
      },
    });

    // Add team members
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

    // Create default competencies
    await createDefaultCompetencies(organization.id);

    // Create test evaluation cycle
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

    const evaluationCycle = await prisma.evaluationCycle.create({
      data: {
        name: '2024 First Half Evaluation',
        type: 'SEMI_ANNUAL',
        startDate,
        endDate,
        status: 'ACTIVE',
        organizationId: organization.id,
        phases: {
          create: [
            {
              type: 'SELF',
              name: 'Self Evaluation',
              description: 'Reflect on your achievements and growth',
              startDate,
              endDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week later
              order: 1,
            },
            {
              type: 'PEER',
              name: 'Peer Evaluation',
              description: 'Feedback from colleagues',
              startDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
              endDate: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks later
              order: 2,
            },
            {
              type: 'MANAGER',
              name: 'Manager Evaluation',
              description: 'Evaluation and feedback from manager',
              startDate: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000),
              endDate: new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 weeks later
              order: 3,
            },
            {
              type: 'CALIBRATION',
              name: 'Calibration',
              description: 'Evaluation adjustment and finalization',
              startDate: new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000),
              endDate,
              order: 4,
            },
          ],
        },
      },
    });

    // Create evaluations (simulate auto-generated evaluations)
    const competencies = await prisma.competency.findMany({
      where: { organizationId: organization.id },
    });

    // Create evaluations for each member
    for (const evaluatee of [member1, member2, member3]) {
      // Self evaluation
      const selfEvaluation = await prisma.evaluation.create({
        data: {
          cycleId: evaluationCycle.id,
          evaluateeId: evaluatee.id,
          evaluatorId: evaluatee.id,
          type: 'SELF',
          overallRating: Math.floor(Math.random() * 2) + 4, // Random 4-5
          overallComments:
            '今期は新しい技術への取り組みと、チームとの連携を重視して業務に取り組みました。',
          strengths: '新技術の習得が早く、チームメンバーとのコミュニケーションが円滑です。',
          improvements: 'プロジェクト管理スキルをさらに向上させたいと思います。',
          careerGoals: 'リードエンジニアとしてチーム全体の技術力向上に貢献したいです。',
          developmentPlan:
            '来期はプロジェクト管理研修を受講し、より効率的な開発プロセスを学びたいです。',
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
          overallRating: Math.floor(Math.random() * 2) + 3, // Random 3-4
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
            rating: Math.floor(Math.random() * 2) + 3, // Random 3-4
            evidence: `Specific observations and evaluation regarding ${competency.name} from a manager perspective.`,
          },
        });
      }
    }

    // Create sample Kudos
    await Promise.all([
      prisma.kudos.create({
        data: {
          senderId: manager.id,
          receiverId: member1.id,
          message:
            'Great job on implementing the new feature! Your high-quality code improved the entire team\'s productivity.',
          category: 'INNOVATION',
          points: 3,
        },
      }),
      prisma.kudos.create({
        data: {
          senderId: member2.id,
          receiverId: member3.id,
          message: 'Thank you for your quick response to the bug fix!',
          category: 'PROBLEM_SOLVING',
          points: 2,
        },
      }),
    ]);

    // Create default check-in template
    const checkInTemplate = await prisma.checkInTemplate.create({
      data: {
        organizationId: organization.id,
        name: 'Standard Weekly Check-in',
        description: 'Standard weekly check-in template for testing',
        frequency: 'WEEKLY',
        questions: [
          {
            id: 'achievements',
            type: 'textarea',
            text: 'What did you accomplish this week?',
            required: true,
          },
          {
            id: 'next_goals',
            type: 'textarea',
            text: 'What are your goals for next week?',
            required: true,
          },
        ],
        isDefault: true,
        isActive: true,
      },
    });

    // Create sample check-ins
    for (const user of [member1, member2, member3]) {
      await prisma.checkIn.create({
        data: {
          userId: user.id,
          templateId: checkInTemplate.id,
          answers: {
            achievements: 'Completed new feature development and tests passed successfully.',
            next_goals: 'Will work on the refactoring planned for the next sprint.',
          },
          moodRating: Math.floor(Math.random() * 2) + 4, // Random 4-5
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

// Clear test data
export async function clearTestData() {
  console.log('Clearing existing test data...');

  try {
    // Delete data in order considering foreign key constraints
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

// Global setup
export default async function globalSetup() {
  console.log('Running global setup...');

  // Load environment variables
  loadTestEnv();

  await setupTestData();
}
