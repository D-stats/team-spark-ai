import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { User } from '@prisma/client';

type AuthUser = {
  id: string;
  email: string;
};

type UserWithOrganization = User & {
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export async function getUser(): Promise<AuthUser | null> {
  // TODO: Implement authentication without Supabase
  // For now, return a mock user for development
  // In production, this should check session/JWT tokens
  if (process.env.NODE_ENV === 'development') {
    // Return mock user for development
    return {
      id: 'dev-user-id',
      email: 'dev@example.com',
    };
  }
  return null;
}

export async function getUserWithOrganization(): Promise<{
  user: AuthUser;
  dbUser: UserWithOrganization;
} | null> {
  const user = await getUser();
  if (!user) return null;

  // TODO: Implement user lookup without Supabase
  // For now, return mock data for development
  if (process.env.NODE_ENV === 'development') {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        organization: true,
      },
    });

    if (!dbUser) {
      // Try to find by ID first (in case email changed)
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { organization: true },
      });

      if (existingUser) {
        // Update email if it changed
        if (existingUser.email !== user.email) {
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { email: user.email },
            include: { organization: true },
          });
          return { user, dbUser: updatedUser };
        }
        return { user, dbUser: existingUser };
      }

      // Create a development user if it doesn't exist
      const newUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: 'Development User',
          // Create or connect to a development organization
          organization: {
            connectOrCreate: {
              where: { slug: 'dev-org' },
              create: {
                name: 'Development Organization',
                slug: 'dev-org',
              },
            },
          },
        },
        include: {
          organization: true,
        },
      });
      return { user, dbUser: newUser };
    }

    return { user, dbUser };
  }

  return null;
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireAuthWithOrganization(): Promise<{
  user: AuthUser;
  dbUser: UserWithOrganization;
}> {
  const result = await getUserWithOrganization();
  if (!result?.user) {
    redirect('/login');
  }

  if (!result.dbUser?.organization) {
    redirect('/setup');
  }

  return {
    user: result.user,
    dbUser: result.dbUser,
  };
}

export async function requireNoAuth(): Promise<void> {
  const user = await getUser();
  if (user) {
    redirect('/dashboard');
  }
}
