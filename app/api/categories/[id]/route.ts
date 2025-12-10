import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { CategoryUpdate } from '@/types/category';

// PUT - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CategoryUpdate = await request.json();
    const { type, name, icon, color, is_default } = body;

    // Validate if category exists and belongs to user
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Category tidak ditemukan' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (name !== undefined) updateData.name = name;
    if (icon !== undefined) updateData.icon = icon || null;
    if (color !== undefined) updateData.color = color || null;
    if (is_default !== undefined) updateData.is_default = is_default;

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
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
        message: 'Category berhasil diupdate',
        category: data,
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

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Category berhasil dihapus' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

