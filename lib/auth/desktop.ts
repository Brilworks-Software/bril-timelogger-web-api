import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

/**
 * Validates a desktop user by username
 */
export async function validateDesktopUser(username: string) {
  const supabase = createServerClient();
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, username, account_non_locked')
    .eq('username', username)
    .single();

  if (userError || !user || !user.account_non_locked) {
    return { valid: false, error: 'User not found or account is locked', status: 403 };
  }

  return { valid: true, user };
}

/**
 * Authenticates via session ownership (fallback when JWT expires)
 * Verifies that the sessionId belongs to the username
 */
export async function authenticateViaSessionOwnership(
  username: string,
  sessionId: string
): Promise<{ valid: boolean; user?: any; error?: string; status?: number }> {
  const supabase = createServerClient();
  
  // Validate user exists and is not locked
  const validation = await validateDesktopUser(username);
  if (!validation.valid) {
    return validation;
  }

  // Verify session belongs to this user
  const { data: session, error: sessionError } = await supabase
    .from('tracker_sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .eq('user_id', validation.user.id)
    .single();

  if (sessionError || !session) {
    return { valid: false, error: 'Session not found or does not belong to user', status: 404 };
  }

  return { valid: true, user: validation.user };
}

/**
 * Authenticates a desktop API request with fallback support
 * Tries JWT authentication first, falls back to username/session ownership verification
 * 
 * @param request - The Next.js request object
 * @param username - Username from URL path
 * @param sessionId - Optional sessionId from URL path or query params
 * @returns Authenticated user object or null with error details
 */
export async function authenticateDesktopRequest(
  request: NextRequest,
  username: string,
  sessionId?: string | null
): Promise<{ 
  success: boolean; 
  user?: any; 
  error?: string; 
  status?: number;
}> {
  // Try JWT authentication first
  let jwtUser = await getAuthUser(request);
  let authenticatedUser = null;

  if (jwtUser) {
    // JWT auth succeeded, validate user
    try {
      requireAuth(jwtUser);
      const validation = await validateDesktopUser(username);
      if (validation.valid) {
        authenticatedUser = validation.user;
      }
    } catch (authError) {
      // JWT auth failed, will try fallback
      jwtUser = null;
    }
  }

  // If JWT auth failed or user validation failed, try fallback authentication
  // This allows operations even when JWT token has expired
  if (!authenticatedUser) {
    if (sessionId) {
      // For endpoints with sessionId, verify session ownership
      const fallbackAuth = await authenticateViaSessionOwnership(username, sessionId);
      if (!fallbackAuth.valid) {
        return {
          success: false,
          error: fallbackAuth.error || 'Authentication failed',
          status: fallbackAuth.status || 401
        };
      }
      authenticatedUser = fallbackAuth.user;
    } else {
      // For endpoints without sessionId, just validate username
      // Note: This is less secure, so we only allow it for read operations
      // or operations that don't modify critical data
      const validation = await validateDesktopUser(username);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Authentication failed',
          status: validation.status || 401
        };
      }
      authenticatedUser = validation.user;
    }
  }

  return {
    success: true,
    user: authenticatedUser
  };
}

