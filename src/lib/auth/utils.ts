import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { User } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth.config';
import crypto from 'crypto';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: string;
  avatarUrl?: string;
};

type UserWithOrganization = User & {
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export async function getUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

export async function getUserWithOrganization(): Promise<{
  user: AuthUser;
  dbUser: UserWithOrganization;
} | null> {
  const user = await getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      organization: true,
    },
  });

  if (!dbUser) {
    return null;
  }

  return { user, dbUser };
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

/**
 * API-safe version of requireAuthWithOrganization that returns null instead of redirecting
 * Use this in API routes where redirect() is not supported
 */
export async function requireAuthWithOrganizationAPI(): Promise<{
  user: AuthUser;
  dbUser: UserWithOrganization;
} | null> {
  const result = await getUserWithOrganization();
  if (!result?.user || !result.dbUser?.organization) {
    return null;
  }

  return {
    user: result.user,
    dbUser: result.dbUser,
  };
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
