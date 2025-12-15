import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { AccountUpdate } from '@/types/account';

// PUT - Update account
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: AccountUpdate = await request.json();
    const { name, type, account_number, currency_id, description, is_default } = body;

    // Validate if account exists and belongs to user
    const { data: existing, error: checkError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Account tidak ditemukan' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('accounts')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
        .neq('id', id);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (account_number !== undefined) updateData.account_number = account_number || null;
    if (currency_id !== undefined) updateData.currency_id = currency_id || null;
    if (description !== undefined) updateData.description = description || null;
    if (is_default !== undefined) updateData.is_default = is_default;

    const { data, error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        currency:currencies(id, code, symbol)
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Account berhasil diupdate',
        account: data,
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

// DELETE - Delete account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if account has transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id')
      .eq('account_id', id)
      .limit(1);

    if (txError) {
      return NextResponse.json(
        { error: 'Gagal memeriksa transaksi' },
        { status: 400 }
      );
    }

    if (transactions && transactions.length > 0) {
      return NextResponse.json(
        { error: 'Account tidak dapat dihapus karena masih memiliki transaksi' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Account berhasil dihapus' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
