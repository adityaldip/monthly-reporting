import { cookies } from 'next/headers';
import { createServerClient } from './server';

export async function getAuthenticatedUser() {
  const supabase = createServerClient();
  
  // Get session from cookies
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  if (!accessToken && !refreshToken) {
    return { user: null, error: 'No session found' };
  }

  // Try to get user with access token first
  if (accessToken) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    // If access token is valid, return user
    if (!error && user) {
      return { user, error: null };
    }
    
    // If error is not about expired token, return error
    if (error && !error.message.includes('expired') && !error.message.includes('invalid')) {
      return { user: null, error: error.message };
    }
  }

  // If access token is invalid/expired, try to refresh using refresh token
  if (refreshToken) {
    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (!refreshError && refreshData?.session && refreshData?.user) {
        // Successfully refreshed, return the user
        return { user: refreshData.user, error: null };
      }
    } catch (err) {
      // Refresh failed, return error
      console.error('Failed to refresh session:', err);
    }
    
    // If refresh failed, return error
    return { user: null, error: 'Session expired. Please login again.' };
  }

  return { user: null, error: 'Authentication failed' };
}

