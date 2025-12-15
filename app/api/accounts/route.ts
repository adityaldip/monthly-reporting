import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { AccountCreate } from '@/types/account';

// GET - Get all accounts for authenticated user
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
      .from('accounts')
      .select(`
        *,
        currency:currencies(id, code, symbol)
      `)
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ accounts: data || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST - Create new account
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: AccountCreate = await request.json();
    const { name, type, account_number, currency_id, description, is_default } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name dan type wajib diisi' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('accounts')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name,
        type,
        account_number: account_number || null,
        currency_id: currency_id || null,
        description: description || null,
        is_default: is_default || false,
      })
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
        message: 'Account berhasil dibuat',
        account: data,
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
