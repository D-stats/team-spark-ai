'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

/**
 * Hook to track user sessions and ensure session records are created
 */
export function useSessionTracking(): { session: unknown; status: string } {
  const { data: session, status } = useSession();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (
      status === 'authenticated' &&
      session?.user !== null &&
      session?.user !== undefined &&
      !hasTracked.current
    ) {
      hasTracked.current = true;

      // Track session creation
      fetch('/api/auth/track-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
        }),
      }).catch((error) => {
        console.error('Failed to track session:', error);
      });

      // Update session activity on window focus
      const handleFocus = () => {
        fetch('/api/auth/track-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update',
          }),
        }).catch(() => {
          // Silently fail - this is just for tracking
        });
      };

      window.addEventListener('focus', handleFocus);

      return () => {
        window.removeEventListener('focus', handleFocus);
      };
    }

    return undefined;
  }, [session, status]);

  return { session, status };
}
