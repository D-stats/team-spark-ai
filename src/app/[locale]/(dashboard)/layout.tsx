import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SessionValidator } from '@/components/session-validator';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const { user, dbUser } = await requireAuthWithOrganization();

  return (
    <div className="flex h-screen bg-gray-50">
      <SessionValidator />
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header
          user={user}
          organization={dbUser.organization as NonNullable<typeof dbUser.organization>}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
