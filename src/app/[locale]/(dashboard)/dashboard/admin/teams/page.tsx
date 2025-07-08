import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import TeamManagement from '@/components/admin/TeamManagement';

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const t = await getTranslations('admin.teams');

  // Get teams with their members and managers
  const teams = await prisma.team.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      manager: {
        select: { id: true, name: true, email: true }
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      },
      _count: {
        select: { members: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get users for team assignment
  const users = await prisma.user.findMany({
    where: { 
      organizationId: session.user.organizationId,
      isActive: true
    },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true 
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-gray-600 mt-2">{t('description')}</p>
      </div>
      
      <TeamManagement teams={teams} users={users} />
    </div>
  );
}