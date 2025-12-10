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

    // Get transactions
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    // Add limit if specified
    const limit = searchParams.get('limit');
    if (limit) {
      query = query.limit(parseInt(limit));
    }

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

    const { data: transactions, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Optimize: Batch fetch all currencies and categories instead of N+1 queries
    const currencyIds = [...new Set((transactions || []).filter(tx => tx.currency_id).map(tx => tx.currency_id))];
    const categoryIds = [...new Set((transactions || []).filter(tx => tx.category_id).map(tx => tx.category_id))];

    // Batch fetch currencies
    const currencyMap = new Map();
    if (currencyIds.length > 0) {
      const { data: currenciesData } = await supabase
        .from('currencies')
        .select('id, code, name, symbol')
        .in('id', currencyIds)
        .eq('user_id', user.id);
      
      currenciesData?.forEach((curr) => {
        currencyMap.set(curr.id, curr);
      });
    }

    // Batch fetch categories
    const categoryMap = new Map();
    if (categoryIds.length > 0) {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, icon, color')
        .in('id', categoryIds)
        .eq('user_id', user.id);
      
      categoriesData?.forEach((cat) => {
        categoryMap.set(cat.id, cat);
      });
    }

    // Enrich transactions with currency and category info from maps
    const enrichedTransactions = (transactions || []).map((tx: any) => {
      const enriched: any = { ...tx };

      // Get currency info from map
      if (tx.currency_id && currencyMap.has(tx.currency_id)) {
        enriched.currency = currencyMap.get(tx.currency_id);
      }

      // Get category info from map
      if (tx.category_id && categoryMap.has(tx.category_id)) {
        enriched.category = categoryMap.get(tx.category_id);
      }

      return enriched;
    });

    return NextResponse.json({ transactions: enrichedTransactions }, { status: 200 });
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
    const { type, amount, currency, currency_id, description, category, category_id, date } = body;

    // Support both legacy format (currency, category) and new format (currency_id, category_id)
    const finalCurrencyId = currency_id || null;
    const finalCategoryId = category_id || null;
    const finalCurrency = currency || null;
    const finalCategory = category || null;

    if (!type || !amount || !date) {
      return NextResponse.json(
        { error: 'Type, amount, dan date wajib diisi' },
        { status: 400 }
      );
    }

    // Must have either currency_id or currency (legacy)
    if (!finalCurrencyId && !finalCurrency) {
      return NextResponse.json(
        { error: 'Currency wajib diisi' },
        { status: 400 }
      );
    }

    // Must have either category_id or category (legacy)
    if (!finalCategoryId && !finalCategory) {
      return NextResponse.json(
        { error: 'Category wajib diisi' },
        { status: 400 }
      );
    }

    if (type !== 'income' && type !== 'outcome') {
      return NextResponse.json(
        { error: 'Type harus income atau outcome' },
        { status: 400 }
      );
    }

    // Validate category_id exists and belongs to user and matches type
    let categoryName = finalCategory;
    if (finalCategoryId) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, type, name')
        .eq('id', finalCategoryId)
        .eq('user_id', user.id)
        .single();

      if (categoryError || !categoryData) {
        return NextResponse.json(
          { error: 'Category tidak ditemukan' },
          { status: 400 }
        );
      }

      if (categoryData.type !== type) {
        return NextResponse.json(
          { error: 'Category type tidak sesuai dengan transaction type' },
          { status: 400 }
        );
      }

      // Get category name from database
      categoryName = categoryData.name;
    } else {
      // Legacy validation for category string
      if (type === 'income') {
        const validCategories = getIncomeCategories();
        if (!validCategories.includes(finalCategory as any)) {
          return NextResponse.json(
            { error: `Category untuk income harus salah satu dari: ${validCategories.join(', ')}` },
            { status: 400 }
          );
        }
      } else {
        const validCategories = getOutcomeCategories();
        if (!validCategories.includes(finalCategory as any)) {
          return NextResponse.json(
            { error: `Category untuk outcome harus salah satu dari: ${validCategories.join(', ')}` },
            { status: 400 }
          );
        }
      }
    }

    // Validate currency_id exists and belongs to user
    let currencyCode = finalCurrency;
    if (finalCurrencyId) {
      const { data: currencyData, error: currencyError } = await supabase
        .from('currencies')
        .select('id, code')
        .eq('id', finalCurrencyId)
        .eq('user_id', user.id)
        .single();

      if (currencyError || !currencyData) {
        return NextResponse.json(
          { error: 'Currency tidak ditemukan' },
          { status: 400 }
        );
      }

      // Get currency code from database
      currencyCode = currencyData.code;
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount harus lebih dari 0' },
        { status: 400 }
      );
    }

    const insertData: any = {
      user_id: user.id,
      type,
      amount,
      description: description || null,
      date,
    };

    // Use new format (currency_id, category_id) and also populate legacy fields
    if (finalCurrencyId) {
      insertData.currency_id = finalCurrencyId;
      insertData.currency = currencyCode; // Populate legacy field with code from database
    } else {
      insertData.currency = finalCurrency;
    }

    if (finalCategoryId) {
      insertData.category_id = finalCategoryId;
      insertData.category = categoryName; // Populate legacy field with name from database
    } else {
      insertData.category = finalCategory;
    }

    const { data, error } = await supabase
      .from('transactions')
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

