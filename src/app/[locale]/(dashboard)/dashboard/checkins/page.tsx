import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { TemplateBasedCheckIn } from '@/components/checkins/template-based-checkin';
import { CheckInHistory } from '@/components/checkins/checkin-history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { CreateDefaultTemplateButton } from '@/components/checkins/create-default-template-button';

export default async function CheckInsPage() {
  const { dbUser } = await requireAuthWithOrganization();

  // Get default template (prompt creation if it doesn't exist)
  const defaultTemplate = await prisma.checkInTemplate.findFirst({
    where: {
      organizationId: dbUser.organizationId,
      isDefault: true,
      isActive: true,
    },
  });

  // Get past check-in history
  const checkInHistoryData = await prisma.checkIn.findMany({
    where: {
      userId: dbUser.id,
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          frequency: true,
          questions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Cast JsonValue to Question[]
  const checkInHistory = checkInHistoryData.map((checkIn) => ({
    ...checkIn,
    answers: checkIn.answers as Record<string, unknown>,
    template: {
      ...checkIn.template,
      questions:
        (checkIn.template.questions as {
          id: string;
          type: string;
          text: string;
          required: boolean;
        }[]) || [],
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Check-ins</h1>
          <p className="mt-2 text-muted-foreground">
            Record regular reflections with customized templates
          </p>
        </div>
        {dbUser.role === 'ADMIN' && (
          <Link href="/dashboard/checkins/templates">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Template Management
            </Button>
          </Link>
        )}
      </div>

      {!defaultTemplate ? (
        <Card>
          <CardHeader>
            <CardTitle>No Template Configured</CardTitle>
            <CardDescription>
              To start check-ins, an administrator must first create a template
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dbUser.role === 'ADMIN' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Please create your organization&apos;s first check-in template. You can start from
                  a default template or create a custom one.
                </p>
                <div className="flex gap-3">
                  <CreateDefaultTemplateButton />
                  <Link href="/dashboard/checkins/templates">
                    <Button variant="outline">Create Custom Template</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Please ask an administrator to create a template.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TemplateBasedCheckIn />
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Check-in History</CardTitle>
                <CardDescription>Past check-in records</CardDescription>
              </CardHeader>
              <CardContent>
                <CheckInHistory checkIns={checkInHistory} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
