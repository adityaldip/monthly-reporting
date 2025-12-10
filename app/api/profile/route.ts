import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, created_at')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Profil tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { full_name } = body;

    const updateData: any = {};
    if (full_name !== undefined) {
      updateData.full_name = full_name || null;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select('id, email, full_name, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Profil berhasil diupdate',
        profile: data,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

