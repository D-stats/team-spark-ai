import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { registerRateLimit, createRateLimitResponse } from '@/lib/auth/rate-limit';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Apply rate limiting
  const rateLimitResult = await registerRateLimit(request);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetTime);
  }

  try {
    const body = (await request.json()) as RegisterRequest;
    const { email, password, name, organizationName } = body;

    // Validate required fields
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof name !== 'string' ||
      typeof organizationName !== 'string'
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Organization name is now mandatory
    if (!organizationName || organizationName.trim().length === 0) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new organization - organization name is mandatory
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    // Check if organization slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'An organization with this name already exists' },
        { status: 409 },
      );
    }

    const newOrg = await prisma.organization.create({
      data: {
        name: organizationName,
        slug,
        settings: {},
        planType: 'FREE',
        maxUsers: 25, // Free plan limit
      },
    });

    // User becomes admin of their new organization
    const targetOrganizationId = newOrg.id;
    const userRole = 'ADMIN';

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        organizationId: targetOrganizationId,
        role: userRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        organizationId: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    // Log error details for debugging but avoid console in production
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
