import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const t = await getTranslations('admin');

  // Get organization statistics
  const [userCount, teamCount, activeUsersCount, recentActivities] = await Promise.all([
    prisma.user.count({
      where: { organizationId: session.user.organizationId }
    }),
    prisma.team.count({
      where: { organizationId: session.user.organizationId }
    }),
    prisma.user.count({
      where: { 
        organizationId: session.user.organizationId,
        isActive: true,
        lastActiveAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      }
    }),
    prisma.loginHistory.findMany({
      where: {
        user: { organizationId: session.user.organizationId }
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { loginAt: 'desc' },
      take: 10
    })
  ]);

  const stats = {
    totalUsers: userCount,
    totalTeams: teamCount,
    activeUsers: activeUsersCount,
    recentActivities
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-gray-600 mt-2">{t('description')}</p>
      </div>
      
      <AdminDashboard stats={stats} />
    </div>
  );
}