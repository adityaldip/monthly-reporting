import { cookies } from 'next/headers';
import { createServerClient } from './server';

export async function getAuthenticatedUser() {
  const supabase = createServerClient();
  
  // Get session from cookies
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  if (!accessToken) {
    return { user: null, error: 'No session found' };
  }

  // Set session manually
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    // Try to refresh if we have refresh token
    if (refreshToken) {
      const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (!refreshError && sessionData?.session) {
        return { user: sessionData.user, error: null };
      }
    }
    return { user: null, error: error?.message || 'Authentication failed' };
  }

  return { user, error: null };
}

