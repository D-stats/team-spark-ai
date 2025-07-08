import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import AuditTrail from '@/components/admin/AuditTrail';

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const t = await getTranslations('admin.audit');

  // Get audit trail data (login history as a starting point)
  const auditLogs = await prisma.loginHistory.findMany({
    where: {
      user: { organizationId: session.user.organizationId }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { loginAt: 'desc' },
    take: 100
  });

  // Get user sessions for active sessions monitoring
  const activeSessions = await prisma.userSession.findMany({
    where: {
      user: { organizationId: session.user.organizationId },
      isActive: true,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { lastUsedAt: 'desc' },
    take: 50
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-gray-600 mt-2">{t('description')}</p>
      </div>
      
      <AuditTrail auditLogs={auditLogs} activeSessions={activeSessions} />
    </div>
  );
}