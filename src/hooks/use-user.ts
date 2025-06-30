/**
 * ユーザー情報取得フック
 */

'use client';

import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  organizationId: string;
  avatar?: string;
}

export function useUser(): {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { data: session, status, update } = useSession();

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as 'ADMIN' | 'MANAGER' | 'MEMBER',
        organizationId: session.user.organizationId,
        avatar: session.user.avatarUrl,
      }
    : null;

  return {
    user,
    loading: status === 'loading',
    error: null,
    refetch: () => {
      update();
    },
  };
}
