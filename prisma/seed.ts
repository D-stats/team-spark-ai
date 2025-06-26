import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      settings: {
        features: {
          kudos: true,
          okr: true,
          evaluation: true,
          survey: true,
        },
      },
    },
  });

  console.log('✅ Organization created:', organization.name);

  // Create users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: {
        email: 'admin@demo.com',
        name: 'Admin User',
        role: 'ADMIN',
        organizationId: organization.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah.manager@demo.com' },
      update: {},
      create: {
        email: 'sarah.manager@demo.com',
        name: 'Sarah Johnson',
        role: 'MANAGER',
        organizationId: organization.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'john.dev@demo.com' },
      update: {},
      create: {
        email: 'john.dev@demo.com',
        name: 'John Smith',
        role: 'MEMBER',
        organizationId: organization.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'emily.sales@demo.com' },
      update: {},
      create: {
        email: 'emily.sales@demo.com',
        name: 'Emily Davis',
        role: 'MEMBER',
        organizationId: organization.id,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Users created:', users.length);

  // Create teams
  const engineeringTeam = await prisma.team.create({
    data: {
      name: 'Engineering Team',
      description: 'Product development and technical infrastructure',
      organizationId: organization.id,
      managerId: users[1].id, // Sarah Johnson
    },
  });

  const salesTeam = await prisma.team.create({
    data: {
      name: 'Sales Team',
      description: 'Customer acquisition and revenue growth',
      organizationId: organization.id,
      managerId: users[1].id, // Sarah Johnson
    },
  });

  console.log('✅ Teams created:', [engineeringTeam.name, salesTeam.name]);

  // Add team members
  await Promise.all([
    prisma.teamMember.upsert({
      where: {
        teamId_userId: {
          userId: users[1].id, // manager
          teamId: engineeringTeam.id,
        },
      },
      update: {},
      create: {
        userId: users[1].id,
        teamId: engineeringTeam.id,
      },
    }),
    prisma.teamMember.upsert({
      where: {
        teamId_userId: {
          userId: users[2].id, // member1
          teamId: engineeringTeam.id,
        },
      },
      update: {},
      create: {
        userId: users[2].id,
        teamId: engineeringTeam.id,
      },
    }),
    prisma.teamMember.upsert({
      where: {
        teamId_userId: {
          userId: users[3].id, // member2
          teamId: salesTeam.id,
        },
      },
      update: {},
      create: {
        userId: users[3].id,
        teamId: salesTeam.id,
      },
    }),
  ]);

  console.log('✅ Team members added');

  // Create some kudos
  const kudosList = await Promise.all([
    prisma.kudos.create({
      data: {
        senderId: users[1].id, // Sarah Johnson
        receiverId: users[2].id, // John Smith
        message: 'Great job on the presentation! Your technical insights were invaluable.',
        category: 'INNOVATION',
        isPublic: true,
      },
    }),
    prisma.kudos.create({
      data: {
        senderId: users[2].id, // John Smith
        receiverId: users[3].id, // Emily Davis
        message:
          'Thanks for helping me understand the sales process. Your patience is appreciated!',
        category: 'TEAMWORK',
        isPublic: true,
      },
    }),
    prisma.kudos.create({
      data: {
        senderId: users[3].id, // Emily Davis
        receiverId: users[1].id, // Sarah Johnson
        message: 'Your leadership during the project launch was inspiring. Thank you!',
        category: 'LEADERSHIP',
        isPublic: true,
      },
    }),
  ]);

  console.log('✅ Kudos created:', kudosList.length);

  // Create objectives and key results for Q1 2025
  const objective = await prisma.objective.create({
    data: {
      title: 'Improve Product Quality',
      description:
        'Enhance product reliability and user satisfaction through systematic improvements',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      organizationId: organization.id,
      ownerType: 'INDIVIDUAL',
      ownerUserId: users[1].id, // Sarah Johnson
      ownerTeamId: null,
      cycle: 'Q1',
      year: 2025,
      status: 'ACTIVE',
      keyResults: {
        create: [
          {
            title: 'Reduce bug rate by 20%',
            type: 'METRIC',
            targetValue: 20,
            currentValue: 5,
            unit: '%',
            ownerId: users[2].id, // John Smith
          },
          {
            title: 'Increase user satisfaction score to 4.5+',
            type: 'METRIC',
            targetValue: 4.5,
            currentValue: 4.2,
            unit: 'score',
            ownerId: users[2].id, // John Smith
          },
        ],
      },
    },
  });

  console.log('✅ Objectives created:', objective.title);

  console.log('🎉 Seeding completed!');
  console.log('\n📝 Login credentials:');
  console.log('Admin: admin@demo.com');
  console.log('Manager: sarah.manager@demo.com');
  console.log('Developer: john.dev@demo.com');
  console.log('Sales: emily.sales@demo.com');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
