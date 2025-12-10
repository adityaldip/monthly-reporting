import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { CategoryCreate } from '@/types/category';

// GET - Get all categories for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ categories: data || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CategoryCreate = await request.json();
    const { type, name, icon, color, is_default } = body;

    if (!type || !name) {
      return NextResponse.json(
        { error: 'Type dan name wajib diisi' },
        { status: 400 }
      );
    }

    if (type !== 'income' && type !== 'outcome') {
      return NextResponse.json(
        { error: 'Type harus income atau outcome' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        type,
        name,
        icon: icon || null,
        color: color || null,
        is_default: is_default || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Category berhasil dibuat',
        category: data,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

