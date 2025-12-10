import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// GET - Get reports data
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
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const month = searchParams.get('month'); // Optional: specific month

    // Get date range
    let startDate = '';
    let endDate = '';
    
    if (month) {
      startDate = `${year}-${month.padStart(2, '0')}-01`;
      endDate = `${year}-${month.padStart(2, '0')}-31`;
    } else {
      // Full year
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    }

    // Get all transactions for the period
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount, currency, currency_id, category, category_id, date')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Get default currency
    const { data: defaultCurrency } = await supabase
      .from('currencies')
      .select('code, exchange_rate')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (!defaultCurrency) {
      return NextResponse.json(
        { error: 'Default currency tidak ditemukan' },
        { status: 400 }
      );
    }

    const baseCurrency = defaultCurrency.code;

    // Get all user currencies for exchange rate lookup
    const { data: userCurrencies } = await supabase
      .from('currencies')
      .select('id, code, exchange_rate')
      .eq('user_id', user.id);

    const currencyMap = new Map();
    userCurrencies?.forEach((curr) => {
      currencyMap.set(curr.id, curr);
      currencyMap.set(curr.code, curr);
    });

    // Get categories for name lookup
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, type, icon, color')
      .eq('user_id', user.id);

    const categoryMap = new Map();
    categories?.forEach((cat) => {
      categoryMap.set(cat.id, cat);
    });

    // Convert all transactions to base currency and enrich with category info
    const enrichedTransactions = (transactions || []).map((tx: any) => {
      let currencyCode = baseCurrency;
      if (tx.currency_id) {
        const currencyData = currencyMap.get(tx.currency_id);
        currencyCode = currencyData?.code || baseCurrency;
      } else if (tx.currency) {
        currencyCode = tx.currency;
      }

      // Get category info
      let categoryName = tx.category || 'Unknown';
      let categoryIcon = '';
      let categoryColor = '';
      
      if (tx.category_id) {
        const categoryData = categoryMap.get(tx.category_id);
        if (categoryData) {
          categoryName = categoryData.name;
          categoryIcon = categoryData.icon || '';
          categoryColor = categoryData.color || '';
        }
      }

      // Convert to base currency
      let amount = parseFloat(tx.amount.toString());
      if (currencyCode !== baseCurrency) {
        const currencyData = currencyMap.get(currencyCode);
        const rate = currencyData?.exchange_rate;
        if (rate && rate > 0) {
          amount = amount / rate;
        }
      }

      return {
        ...tx,
        amount,
        currency: currencyCode,
        categoryName,
        categoryIcon,
        categoryColor,
        month: new Date(tx.date).getMonth() + 1,
        year: new Date(tx.date).getFullYear(),
      };
    });

    // Calculate monthly trends
    const monthlyData: Record<number, { income: number; outcome: number }> = {};
    for (let m = 1; m <= 12; m++) {
      monthlyData[m] = { income: 0, outcome: 0 };
    }

    enrichedTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        monthlyData[tx.month].income += tx.amount;
      } else {
        monthlyData[tx.month].outcome += tx.amount;
      }
    });

    const monthlyTrends = Object.entries(monthlyData).map(([month, data]) => ({
      month: parseInt(month),
      monthName: new Date(2000, parseInt(month) - 1).toLocaleString('default', { month: 'short' }),
      income: data.income,
      outcome: data.outcome,
      balance: data.income - data.outcome,
    }));

    // Calculate category breakdown (for outcome only)
    const categoryBreakdown: Record<string, { name: string; amount: number; icon: string; color: string; count: number }> = {};
    
    enrichedTransactions
      .filter((tx) => tx.type === 'outcome')
      .forEach((tx) => {
        const key = tx.categoryName;
        if (!categoryBreakdown[key]) {
          categoryBreakdown[key] = {
            name: key,
            amount: 0,
            icon: tx.categoryIcon || '',
            color: tx.categoryColor || '#6B7280',
            count: 0,
          };
        }
        categoryBreakdown[key].amount += tx.amount;
        categoryBreakdown[key].count += 1;
      });

    const categoryData = Object.values(categoryBreakdown)
      .sort((a, b) => b.amount - a.amount)
      .map((cat) => ({
        name: cat.name,
        value: cat.amount,
        icon: cat.icon,
        color: cat.color,
        count: cat.count,
      }));

    // Calculate insights
    const totalIncome = enrichedTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalOutcome = enrichedTransactions
      .filter((tx) => tx.type === 'outcome')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalTransactions = enrichedTransactions.length;
    const avgTransactionAmount = totalTransactions > 0 
      ? (totalIncome + totalOutcome) / totalTransactions 
      : 0;

    const topCategory = categoryData[0] || null;
    const avgCategorySpending = categoryData.length > 0
      ? totalOutcome / categoryData.length
      : 0;

    // Calculate growth (compare with previous period)
    const prevStartDate = month 
      ? `${year}-${String(parseInt(month) - 1).padStart(2, '0')}-01`
      : `${parseInt(year) - 1}-01-01`;
    const prevEndDate = month
      ? `${year}-${String(parseInt(month) - 1).padStart(2, '0')}-31`
      : `${parseInt(year) - 1}-12-31`;

    const { data: prevTransactions } = await supabase
      .from('transactions')
      .select('type, amount, currency, currency_id, date')
      .eq('user_id', user.id)
      .gte('date', prevStartDate)
      .lte('date', prevEndDate);

    let prevTotalIncome = 0;
    let prevTotalOutcome = 0;

    if (prevTransactions) {
      prevTransactions.forEach((tx: any) => {
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

        if (tx.type === 'income') {
          prevTotalIncome += amount;
        } else {
          prevTotalOutcome += amount;
        }
      });
    }

    const incomeGrowth = prevTotalIncome > 0
      ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100
      : 0;
    const outcomeGrowth = prevTotalOutcome > 0
      ? ((totalOutcome - prevTotalOutcome) / prevTotalOutcome) * 100
      : 0;

    // Get budgets for the period
    const { data: budgets } = await supabase
      .from('budgets')
      .select(`
        *,
        category:categories(id, name, icon, color, type),
        currency:currencies(id, code, name, symbol, exchange_rate)
      `)
      .eq('user_id', user.id)
      .eq('year', parseInt(year));

    if (month) {
      // Filter by month if specified
      const budgetsQuery = supabase
        .from('budgets')
        .select(`
          *,
          category:categories(id, name, icon, color, type),
          currency:currencies(id, code, name, symbol, exchange_rate)
        `)
        .eq('user_id', user.id)
        .eq('year', parseInt(year))
        .eq('month', parseInt(month));
      
      const { data: monthBudgets } = await budgetsQuery;
      
      // Calculate budget vs actual for each budget
      const budgetComparison = (monthBudgets || []).map((budget: any) => {
        const categorySpent = categoryData.find((cat) => cat.name === budget.category?.name);
        const spent = categorySpent?.value || 0;
        
        // Convert budget amount to base currency
        let budgetAmount = parseFloat(budget.amount.toString());
        if (budget.currency?.code !== baseCurrency) {
          const rate = budget.currency?.exchange_rate;
          if (rate && rate > 0) {
            budgetAmount = budgetAmount / rate;
          }
        }
        
        const remaining = budgetAmount - spent;
        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
        
        return {
          ...budget,
          spent,
          budgetAmount,
          remaining,
          percentage: Math.min(percentage, 100),
          isExceeded: spent > budgetAmount,
          isNearLimit: percentage >= (budget.alert_threshold || 80),
        };
      });

      return NextResponse.json({
        period: {
          year: parseInt(year),
          month: parseInt(month),
        },
        summary: {
          totalIncome,
          totalOutcome,
          balance: totalIncome - totalOutcome,
          currency: baseCurrency,
          totalTransactions,
          avgTransactionAmount,
        },
        monthlyTrends,
        categoryBreakdown: categoryData,
        budgetComparison,
        insights: {
          topCategory,
          avgCategorySpending,
          incomeGrowth,
          outcomeGrowth,
          prevPeriod: {
            totalIncome: prevTotalIncome,
            totalOutcome: prevTotalOutcome,
          },
        },
      });
    }

    return NextResponse.json({
      period: {
        year: parseInt(year),
        month: month ? parseInt(month) : null,
      },
      summary: {
        totalIncome,
        totalOutcome,
        balance: totalIncome - totalOutcome,
        currency: baseCurrency,
        totalTransactions,
        avgTransactionAmount,
      },
      monthlyTrends,
      categoryBreakdown: categoryData,
      insights: {
        topCategory,
        avgCategorySpending,
        incomeGrowth,
        outcomeGrowth,
        prevPeriod: {
          totalIncome: prevTotalIncome,
          totalOutcome: prevTotalOutcome,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

