import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/server';

// POST - Refresh session
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      );
    }

    // Refresh session
    const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (refreshError || !sessionData?.session || !sessionData?.user) {
      // Clear cookies on refresh failure
      const response = NextResponse.json(
        { error: refreshError?.message || 'Failed to refresh session' },
        { status: 401 }
      );
      
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      
      return response;
    }

    // Update cookies with new session
    const response = NextResponse.json(
      { 
        message: 'Session refreshed',
        user: {
          id: sessionData.user.id,
          email: sessionData.user.email,
        },
      },
      { status: 200 }
    );

    // Set session token di cookie - 1 week (7 days)
    const oneWeekInSeconds = 60 * 60 * 24 * 7;
    response.cookies.set('sb-access-token', sessionData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: oneWeekInSeconds, // 1 week (7 days)
      path: '/',
    });

    response.cookies.set('sb-refresh-token', sessionData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: oneWeekInSeconds, // 1 week (7 days)
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

