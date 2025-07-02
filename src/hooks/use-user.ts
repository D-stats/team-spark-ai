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
  avatarUrl?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  skills?: string[];
  timezone?: string;
  phoneNumber?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  personalWebsite?: string;
  startDate?: Date;
  locale?: string;
  notificationSettings?: any;
}

export function useUser(): {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  refreshUser: () => void; // Alias for compatibility
} {
  const { data: session, status, update } = useSession();

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as 'ADMIN' | 'MANAGER' | 'MEMBER',
        organizationId: session.user.organizationId,
        avatarUrl: session.user.avatarUrl,
        jobTitle: session.user.jobTitle,
        department: session.user.department,
        bio: session.user.bio,
        skills: session.user.skills,
        timezone: session.user.timezone,
        phoneNumber: session.user.phoneNumber,
        linkedinUrl: session.user.linkedinUrl,
        twitterUrl: session.user.twitterUrl,
        githubUrl: session.user.githubUrl,
        personalWebsite: session.user.personalWebsite,
        startDate: session.user.startDate ? new Date(session.user.startDate) : undefined,
        locale: session.user.locale,
        notificationSettings: session.user.notificationSettings,
      }
    : null;

  const refetchUser = () => {
    update();
  };

  return {
    user,
    loading: status === 'loading',
    error: null,
    refetch: refetchUser,
    refreshUser: refetchUser,
  };
}
