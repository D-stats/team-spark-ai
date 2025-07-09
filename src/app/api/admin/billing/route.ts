import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [subscription, invoices] = await Promise.all([
      prisma.subscription.findFirst({
        where: { organizationId: user.organizationId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.findMany({
        where: { organizationId: user.organizationId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          lineItems: true,
        },
      }),
    ]);

    return NextResponse.json({
      subscription,
      invoices,
    });
  } catch (error) {
    console.error('Billing fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { planId, billingInterval, paymentMethod } = body;

    if (!planId || !billingInterval) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if organization already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        organizationId: user.organizationId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (existingSubscription) {
      return NextResponse.json({ error: 'Organization already has an active subscription' }, { status: 409 });
    }

    // Get pricing based on plan and interval
    const pricing = getPlanPricing(planId, billingInterval);
    if (!pricing) {
      return NextResponse.json({ error: 'Invalid plan or billing interval' }, { status: 400 });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingInterval === 'MONTHLY') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const subscription = await prisma.subscription.create({
      data: {
        organizationId: user.organizationId,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        unitPrice: pricing.price,
        currency: pricing.currency,
        billingInterval,
        paymentMethod,
        nextPaymentDate: periodEnd,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getPlanPricing(planId: string, billingInterval: string) {
  const plans = {
    'basic': {
      monthly: { price: 29.99, currency: 'USD' },
      yearly: { price: 299.99, currency: 'USD' },
    },
    'pro': {
      monthly: { price: 59.99, currency: 'USD' },
      yearly: { price: 599.99, currency: 'USD' },
    },
    'enterprise': {
      monthly: { price: 129.99, currency: 'USD' },
      yearly: { price: 1299.99, currency: 'USD' },
    },
  };

  const plan = plans[planId as keyof typeof plans];
  if (!plan) return null;

  const interval = billingInterval.toLowerCase() as 'monthly' | 'yearly';
  return plan[interval];
}