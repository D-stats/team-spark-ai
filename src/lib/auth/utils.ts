import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserWithOrganization() {
  const user = await getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: { organization: true },
  });

  return { user, dbUser };
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireAuthWithOrganization() {
  const result = await getUserWithOrganization();
  if (!result?.user) {
    redirect('/login');
  }
  
  if (!result.dbUser?.organization) {
    redirect('/setup');
  }

  return {
    user: result.user,
    dbUser: result.dbUser!
  };
}

export async function requireNoAuth() {
  const user = await getUser();
  if (user) {
    redirect('/dashboard');
  }
}