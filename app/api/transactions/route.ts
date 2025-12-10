import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { TransactionCreate, getIncomeCategories, getOutcomeCategories } from '@/types/transaction';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// GET - Get all transactions for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const currency = searchParams.get('currency');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (currency) {
      query = query.eq('currency', currency);
    }

    if (year && month) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    } else if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ transactions: data || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST - Create new transaction
export async function POST(request: NextRequest) {
  try {
    // Try to get user from auth header first (for client-side calls)
    const authHeader = request.headers.get('authorization');
    let user = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && authUser) {
        user = authUser;
      }
    }

    // Fallback to cookie-based auth
    if (!user) {
      const { user: cookieUser, error: authError } = await getAuthenticatedUser();
      if (authError || !cookieUser) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      user = cookieUser;
    }

    const body: TransactionCreate = await request.json();
    const { type, amount, currency, description, category, date } = body;

    if (!type || !amount || !currency || !date || !category) {
      return NextResponse.json(
        { error: 'Type, amount, currency, category, dan date wajib diisi' },
        { status: 400 }
      );
    }

    if (type !== 'income' && type !== 'outcome') {
      return NextResponse.json(
        { error: 'Type harus income atau outcome' },
        { status: 400 }
      );
    }

    // Validate category based on type
    if (type === 'income') {
      const validCategories = getIncomeCategories();
      if (!validCategories.includes(category as any)) {
        return NextResponse.json(
          { error: `Category untuk income harus salah satu dari: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
    } else {
      const validCategories = getOutcomeCategories();
      if (!validCategories.includes(category as any)) {
        return NextResponse.json(
          { error: `Category untuk outcome harus salah satu dari: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount harus lebih dari 0' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type,
        amount,
        currency,
        description: description || null,
        category: category,
        date,
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
        message: 'Transaksi berhasil dibuat',
        transaction: data
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

