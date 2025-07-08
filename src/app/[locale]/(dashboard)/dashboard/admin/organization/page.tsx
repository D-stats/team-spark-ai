import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import OrganizationManagement from '@/components/admin/OrganizationManagement';

export default async function OrganizationPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const t = await getTranslations('admin.organization');

  // Get organization details with statistics
  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    include: {
      _count: {
        select: {
          users: true,
          teams: true
        }
      }
    }
  });

  if (!organization) {
    redirect('/dashboard');
  }

  // Get usage statistics
  const [activeUsers, recentLogins, teamStats] = await Promise.all([
    prisma.user.count({
      where: { 
        organizationId: session.user.organizationId,
        isActive: true,
        lastActiveAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      }
    }),
    prisma.loginHistory.count({
      where: {
        user: { organizationId: session.user.organizationId },
        loginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      }
    }),
    prisma.team.findMany({
      where: { organizationId: session.user.organizationId },
      select: {
        id: true,
        name: true,
        _count: {
          select: { members: true }
        }
      }
    })
  ]);

  const stats = {
    totalUsers: organization._count.users,
    totalTeams: organization._count.teams,
    activeUsers,
    recentLogins,
    teamStats
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-gray-600 mt-2">{t('description')}</p>
      </div>
      
      <OrganizationManagement organization={organization} stats={stats} />
    </div>
  );
}