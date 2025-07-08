import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import UserManagement from '@/components/admin/UserManagement';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const t = await getTranslations('admin.users');

  // Get users with their team memberships
  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      teamMemberships: {
        include: {
          team: {
            select: { id: true, name: true }
          }
        }
      },
      managedTeams: {
        select: { id: true, name: true }
      },
      _count: {
        select: {
          teamMemberships: true,
          managedTeams: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get teams for user assignment
  const teams = await prisma.team.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true }
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-gray-600 mt-2">{t('description')}</p>
      </div>
      
      <UserManagement users={users} teams={teams} />
    </div>
  );
}