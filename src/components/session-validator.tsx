'use client';

import { useSessionValidation } from '@/hooks/use-session-validation';
import { useSessionTracking } from '@/hooks/use-session-tracking';

/**
 * Component that validates user sessions and tracks session activity
 * Combines session validation and session tracking functionality
 */
export function SessionValidator(): null {
  // Validate that the session is still active in the database
  useSessionValidation();

  // Track session activity for new sessions
  useSessionTracking();

  return null;
}
