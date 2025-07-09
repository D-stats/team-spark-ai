import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...updateData } = body;

    const subscription = await prisma.subscription.findFirst({
      where: {
        organizationId: user.organizationId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    let updatedSubscription;

    switch (action) {
      case 'cancel':
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            cancelAtPeriodEnd: true,
            canceledAt: new Date(),
          },
        });
        break;

      case 'reactivate':
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            cancelAtPeriodEnd: false,
            canceledAt: null,
            status: 'ACTIVE',
          },
        });
        break;

      case 'update':
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscription.id },
          data: updateData,
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}