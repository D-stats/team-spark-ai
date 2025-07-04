'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface SessionValidationReturn {
  session: unknown;
  status: string;
}

/**
 * Hook to validate that the user's session is still active in the database
 * If session is terminated, automatically sign out the user
 */
export function useSessionValidation(): SessionValidationReturn {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const lastCheckRef = useRef<number>(0);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (status === 'authenticated' && session?.user !== null && session?.user !== undefined) {
      // Record when this session started
      if (sessionStartTimeRef.current === 0) {
        sessionStartTimeRef.current = Date.now();
      }

      const validateSession = async () => {
        try {
          // Don't validate too soon after login to allow session creation time
          const timeSinceSessionStart = Date.now() - sessionStartTimeRef.current;
          if (timeSinceSessionStart < 10000) {
            // Wait at least 10 seconds after login
            return;
          }

          const response = await fetch('/api/user/sessions/validate', {
            method: 'POST',
          });

          if (response.status === 401) {
            // Session is no longer valid, sign out
            await signOut({
              callbackUrl: `/${pathname.split('/')[1] ?? 'en'}/login?sessionEnded=true`,
              redirect: true,
            });
          }
        } catch (error) {
          // Silently handle errors - don't sign out on network issues
          console.error('Session validation error:', error);
        }
      };

      // Validate immediately if it's been more than 5 minutes since last check
      const now = Date.now();
      if (now - lastCheckRef.current > 5 * 60 * 1000) {
        lastCheckRef.current = now;
        validateSession();
      }

      // Set up periodic validation every 30 seconds (more frequent for better security)
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }

      checkIntervalRef.current = setInterval(() => {
        validateSession();
      }, 30 * 1000); // 30 seconds

      // Validate on window focus
      const handleFocus = () => {
        const now = Date.now();
        if (now - lastCheckRef.current > 30 * 1000) {
          // Only if it's been 30+ seconds
          lastCheckRef.current = now;
          validateSession();
        }
      };

      // Listen for session termination messages
      const handleMessage = (event: MessageEvent<{ type?: string; sessionId?: string }>) => {
        if (event.data?.type === 'SESSION_TERMINATED') {
          // Immediate validation when a session is terminated
          validateSession();
        }
      };

      window.addEventListener('focus', handleFocus);
      window.addEventListener('message', handleMessage);

      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('message', handleMessage);
      };
    }

    return undefined;
  }, [session, status, pathname]);

  return { session, status };
}
