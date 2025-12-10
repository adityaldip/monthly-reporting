import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { RecurringTransactionCreate } from '@/types/recurring-transaction';

// GET - Get all recurring transactions for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: recurringTransactions, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('next_date', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Enrich with currency and category data
    const enriched = await Promise.all(
      (recurringTransactions || []).map(async (rt: any) => {
        if (rt.currency_id) {
          const { data: currencyData } = await supabase
            .from('currencies')
            .select('id, code, name, symbol')
            .eq('id', rt.currency_id)
            .single();
          
          if (currencyData) {
            rt.currency_data = currencyData;
          }
        }

        if (rt.category_id) {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id, name, icon, color, type')
            .eq('id', rt.category_id)
            .single();
          
          if (categoryData) {
            rt.category_data = categoryData;
          }
        }

        return rt;
      })
    );

    return NextResponse.json({ recurringTransactions: enriched }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST - Create new recurring transaction
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: RecurringTransactionCreate = await request.json();
    const { type, amount, currency_id, category_id, description, frequency, start_date, end_date } = body;

    if (!type || !amount || !frequency || !start_date) {
      return NextResponse.json(
        { error: 'Type, amount, frequency, dan start_date wajib diisi' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount harus lebih dari 0' },
        { status: 400 }
      );
    }

    if (!currency_id && !body.currency) {
      return NextResponse.json(
        { error: 'Currency wajib diisi' },
        { status: 400 }
      );
    }

    if (!category_id && !body.category) {
      return NextResponse.json(
        { error: 'Category wajib diisi' },
        { status: 400 }
      );
    }

    // Calculate next_date based on frequency
    const start = new Date(start_date);
    let nextDate = new Date(start);
    
    if (frequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    // Get currency code and category name if using IDs
    let currencyCode = body.currency;
    let categoryName = body.category;

    if (currency_id) {
      const { data: currencyData } = await supabase
        .from('currencies')
        .select('code')
        .eq('id', currency_id)
        .eq('user_id', user.id)
        .single();
      
      if (currencyData) {
        currencyCode = currencyData.code;
      }
    }

    if (category_id) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name')
        .eq('id', category_id)
        .eq('user_id', user.id)
        .single();
      
      if (categoryData) {
        categoryName = categoryData.name;
      }
    }

    const insertData: any = {
      user_id: user.id,
      type,
      amount,
      description: description || null,
      frequency,
      start_date,
      end_date: end_date || null,
      next_date: nextDate.toISOString().split('T')[0],
      is_active: true,
    };

    if (currency_id) {
      insertData.currency_id = currency_id;
      insertData.currency = currencyCode;
    } else {
      insertData.currency = currencyCode;
    }

    if (category_id) {
      insertData.category_id = category_id;
      insertData.category = categoryName;
    } else {
      insertData.category = categoryName;
    }

    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert(insertData)
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
        message: 'Recurring transaction berhasil dibuat',
        recurringTransaction: data
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

