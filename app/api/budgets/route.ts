import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { BudgetCreate } from '@/types/budget';

// GET - Get all budgets for authenticated user
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
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    let query = supabase
      .from('budgets')
      .select(`
        *,
        category:categories(id, name, icon, color, type),
        currency:currencies(id, code, name, symbol)
      `)
      .eq('user_id', user.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    if (month) {
      query = query.eq('month', parseInt(month));
    }

    const { data: budgets, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Get default currency for conversion
    const { data: defaultCurrency } = await supabase
      .from('currencies')
      .select('code, exchange_rate')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    const baseCurrency = defaultCurrency?.code || 'IDR';

    // Get all currencies for conversion
    const { data: userCurrencies } = await supabase
      .from('currencies')
      .select('id, code, exchange_rate')
      .eq('user_id', user.id);

    const currencyMap = new Map();
    userCurrencies?.forEach((curr) => {
      currencyMap.set(curr.id, curr);
      currencyMap.set(curr.code, curr);
    });

    // If year/month filter is provided, calculate spent for that period
    // Otherwise, we'll calculate spent for each budget's own period
    let spentByCategory: Record<string, number> = {};
    
    if (year && month) {
      // Single period - calculate spent for that period
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

      const { data: transactions } = await supabase
        .from('transactions')
        .select('category_id, amount, currency, currency_id, type')
        .eq('user_id', user.id)
        .eq('type', 'outcome')
        .gte('date', startDate)
        .lte('date', endDate);

      transactions?.forEach((tx: any) => {
        if (!tx.category_id) return;

        let currencyCode = baseCurrency;
        if (tx.currency_id) {
          const currencyData = currencyMap.get(tx.currency_id);
          currencyCode = currencyData?.code || baseCurrency;
        } else if (tx.currency) {
          currencyCode = tx.currency;
        }

        let amount = parseFloat(tx.amount.toString());
        if (currencyCode !== baseCurrency) {
          const currencyData = currencyMap.get(currencyCode);
          const rate = currencyData?.exchange_rate;
          if (rate && rate > 0) {
            amount = amount / rate;
          }
        }

        if (!spentByCategory[tx.category_id]) {
          spentByCategory[tx.category_id] = 0;
        }
        spentByCategory[tx.category_id] += amount;
      });
    }

    // Enrich budgets with spent amounts
    const enrichedBudgets = [];
    for (const budget of budgets || []) {
      let spentInBaseCurrency = 0;
      
      if (year && month) {
        // Use pre-calculated spent if filtering by single period (already in base currency)
        spentInBaseCurrency = spentByCategory[budget.category_id] || 0;
      } else {
        // Calculate spent for each budget's own period
        const budgetStartDate = `${budget.year}-${String(budget.month).padStart(2, '0')}-01`;
        const budgetEndDate = `${budget.year}-${String(budget.month).padStart(2, '0')}-31`;

        const { data: budgetTransactions } = await supabase
          .from('transactions')
          .select('category_id, amount, currency, currency_id, type')
          .eq('user_id', user.id)
          .eq('type', 'outcome')
          .eq('category_id', budget.category_id)
          .gte('date', budgetStartDate)
          .lte('date', budgetEndDate);

        budgetTransactions?.forEach((tx: any) => {
          let currencyCode = baseCurrency;
          if (tx.currency_id) {
            const currencyData = currencyMap.get(tx.currency_id);
            currencyCode = currencyData?.code || baseCurrency;
          } else if (tx.currency) {
            currencyCode = tx.currency;
          }

          let amount = parseFloat(tx.amount.toString());
          if (currencyCode !== baseCurrency) {
            const currencyData = currencyMap.get(currencyCode);
            const rate = currencyData?.exchange_rate;
            if (rate && rate > 0) {
              amount = amount / rate;
            }
          }

          spentInBaseCurrency += amount;
        });
      }
      const budgetAmount = parseFloat(budget.amount.toString());
      
      // Convert budget amount to base currency if needed
      let budgetInBaseCurrency = budgetAmount;
      if (budget.currency?.code !== baseCurrency) {
        const currencyData = currencyMap.get(budget.currency_id);
        const rate = currencyData?.exchange_rate;
        if (rate && rate > 0) {
          budgetInBaseCurrency = budgetAmount / rate;
        }
      }

      // Calculate remaining in base currency
      const remainingInBaseCurrency = budgetInBaseCurrency - spentInBaseCurrency;
      
      // Convert remaining back to budget currency for display
      let remainingInBudgetCurrency = remainingInBaseCurrency;
      if (budget.currency?.code !== baseCurrency) {
        const currencyData = currencyMap.get(budget.currency_id);
        const rate = currencyData?.exchange_rate;
        if (rate && rate > 0) {
          remainingInBudgetCurrency = remainingInBaseCurrency * rate;
        }
      }

      // Also convert spent to budget currency for display
      let spentInBudgetCurrency = spentInBaseCurrency;
      if (budget.currency?.code !== baseCurrency) {
        const currencyData = currencyMap.get(budget.currency_id);
        const rate = currencyData?.exchange_rate;
        if (rate && rate > 0) {
          spentInBudgetCurrency = spentInBaseCurrency * rate;
        }
      }

      const percentage = budgetInBaseCurrency > 0 ? (spentInBaseCurrency / budgetInBaseCurrency) * 100 : 0;
      const isExceeded = spentInBaseCurrency > budgetInBaseCurrency;
      const isNearLimit = percentage >= (budget.alert_threshold || 80);

      enrichedBudgets.push({
        ...budget,
        spent: spentInBudgetCurrency, // Return spent in budget currency
        remaining: remainingInBudgetCurrency, // Return remaining in budget currency
        percentage: Math.min(percentage, 100),
        isExceeded,
        isNearLimit,
      });
    }

    return NextResponse.json({ budgets: enrichedBudgets }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST - Create new budget
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: BudgetCreate = await request.json();
    const { category_id, year, month, amount, currency_id, alert_threshold } = body;

    if (!category_id || !year || !month || !amount || !currency_id) {
      return NextResponse.json(
        { error: 'Category, year, month, amount, dan currency wajib diisi' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month harus antara 1 dan 12' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount harus lebih dari 0' },
        { status: 400 }
      );
    }

    // Verify category belongs to user
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, type')
      .eq('id', category_id)
      .eq('user_id', user.id)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category tidak ditemukan' },
        { status: 400 }
      );
    }

    // Only allow budgets for outcome categories
    if (category.type !== 'outcome') {
      return NextResponse.json(
        { error: 'Budget hanya bisa dibuat untuk kategori outcome' },
        { status: 400 }
      );
    }

    // Verify currency belongs to user
    const { data: currency, error: currencyError } = await supabase
      .from('currencies')
      .select('id')
      .eq('id', currency_id)
      .eq('user_id', user.id)
      .single();

    if (currencyError || !currency) {
      return NextResponse.json(
        { error: 'Currency tidak ditemukan' },
        { status: 400 }
      );
    }

    // Check if budget already exists for this category, year, month
    const { data: existingBudget } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', user.id)
      .eq('category_id', category_id)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (existingBudget) {
      return NextResponse.json(
        { error: 'Budget untuk kategori ini pada periode tersebut sudah ada' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        category_id,
        year,
        month,
        amount,
        currency_id,
        alert_threshold: alert_threshold || 80.0,
      })
      .select(`
        *,
        category:categories(id, name, icon, color, type),
        currency:currencies(id, code, name, symbol)
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
        message: 'Budget berhasil dibuat',
        budget: data
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

