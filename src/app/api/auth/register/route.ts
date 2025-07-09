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

    // Validate organization name
    if (organizationName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Organization name must be at least 2 characters' },
        { status: 400 },
      );
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

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName.trim(),
          settings: JSON.stringify({
            features: {
              kudos: true,
              surveys: true,
              checkins: true,
            },
            branding: {
              primaryColor: '#000000',
            },
            security: {
              require2fa: false,
              sessionTimeout: 30,
            },
          }),
        },
      });

      // Since this user is creating a new organization, they become the admin
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          organizationId: organization.id,
          role: 'ADMIN', // First user of organization is always admin
          isActive: true,
          lastActiveAt: new Date(), // Set initial activity timestamp
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

      return { user, organization };
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: result.user,
        organization: {
          id: result.organization.id,
          name: result.organization.name,
        },
        isAdmin: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
