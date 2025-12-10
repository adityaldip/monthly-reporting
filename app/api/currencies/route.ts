import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { CurrencyCreate } from '@/types/currency';

// GET - Get all currencies for authenticated user
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
      .from('currencies')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ currencies: data || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST - Create new currency
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CurrencyCreate = await request.json();
    const { code, name, symbol, is_default, exchange_rate } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code dan name wajib diisi' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('currencies')
      .insert({
        user_id: user.id,
        code: code.toUpperCase(),
        name,
        symbol: symbol || null,
        is_default: is_default || false,
        exchange_rate: exchange_rate || 1.0,
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
        message: 'Currency berhasil dibuat',
        currency: data,
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

