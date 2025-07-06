import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { registerRateLimit, createRateLimitResponse } from '@/lib/auth/rate-limit';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organizationId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Apply rate limiting
  const rateLimitResult = await registerRateLimit(request);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetTime);
  }

  try {
    const body = (await request.json()) as RegisterRequest;
    const { email, password, name, organizationId } = body;

    // Validate required fields
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // Create or find default organization
    const defaultOrg = await prisma.organization.upsert({
      where: { slug: 'default-org' },
      update: {},
      create: {
        name: 'Default Organization',
        slug: 'default-org',
        settings: {},
      },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        organizationId: organizationId ?? defaultOrg.id,
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
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
