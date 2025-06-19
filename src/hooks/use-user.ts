/**
 * ユーザー情報取得フック
 */

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  organizationId: string;
  avatar?: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        // APIからユーザー情報を取得
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }

        const result = await response.json();
        
        if (result.success) {
          setUser(result.data);
        } else {
          setError(result.error?.message || 'Failed to fetch user');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // fetchUserを再実行する
    }
  };
}