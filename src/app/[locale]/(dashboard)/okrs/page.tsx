import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { OKRsDashboard } from '@/components/okr/OKRsDashboard';
import { prisma } from '@/lib/prisma';

export default async function OKRsPage(): Promise<JSX.Element> {
  const { dbUser } = await requireAuthWithOrganization();

  // Get full user and organization data
  const fullUser = await prisma.user.findUniqueOrThrow({
    where: { id: dbUser.id },
    include: {
      organization: true,
    },
  });

  return <OKRsDashboard user={fullUser} organization={fullUser.organization ?? undefined} />;
}
