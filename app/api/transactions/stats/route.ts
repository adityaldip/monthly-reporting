import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// GET - Get transaction statistics
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
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const displayCurrency = searchParams.get('displayCurrency'); // Optional: currency to display stats in

    let startDate = '';
    let endDate = '';
    
    if (year && month) {
      startDate = `${year}-${month.padStart(2, '0')}-01`;
      endDate = `${year}-${month.padStart(2, '0')}-31`;
    } else if (year) {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else {
      // Current month
      const now = new Date();
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;
    }

    // Get all transactions for the period
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount, currency, currency_id, date')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Get default currency (base currency)
    const { data: defaultCurrency } = await supabase
      .from('currencies')
      .select('code, exchange_rate')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (!defaultCurrency) {
      return NextResponse.json(
        { error: 'Default currency tidak ditemukan. Silakan set default currency di settings.' },
        { status: 400 }
      );
    }

    const baseCurrency = defaultCurrency.code;
    // Base currency should always have exchange_rate = 1.0
    if (defaultCurrency.exchange_rate !== 1.0) {
      // Fix it
      await supabase
        .from('currencies')
        .update({ exchange_rate: 1.0 })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

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

    // Calculate stats by currency
    const statsByCurrency: Record<string, { income: number; outcome: number }> = {};

    transactions?.forEach((tx) => {
      let currencyCode = baseCurrency;
      
      // Get currency code from currency_id or currency field
      if (tx.currency_id) {
        const currencyData = currencyMap.get(tx.currency_id);
        currencyCode = currencyData?.code || baseCurrency;
      } else if (tx.currency) {
        currencyCode = tx.currency;
      }

      if (!statsByCurrency[currencyCode]) {
        statsByCurrency[currencyCode] = { income: 0, outcome: 0 };
      }

      if (tx.type === 'income') {
        statsByCurrency[currencyCode].income += parseFloat(tx.amount.toString());
      } else {
        statsByCurrency[currencyCode].outcome += parseFloat(tx.amount.toString());
      }
    });

    // Convert all to base currency first
    // exchange_rate from API represents: 1 base currency = exchange_rate * 1 currency
    // Example: base=USD, IDR rate=15000 means 1 USD = 15000 IDR
    // So to convert IDR to USD: amount / exchange_rate
    let totalIncomeBase = 0;
    let totalOutcomeBase = 0;

    for (const [currencyCode, stats] of Object.entries(statsByCurrency)) {
      if (currencyCode === baseCurrency) {
        // Same currency, no conversion needed
        totalIncomeBase += stats.income;
        totalOutcomeBase += stats.outcome;
      } else {
        // Get exchange rate for this currency from map
        const currencyData = currencyMap.get(currencyCode);
        const rate = currencyData?.exchange_rate;
        
        if (!rate || rate <= 0) {
          // Invalid or missing exchange rate
          // Try to get from currency code directly
          const codeData = currencyMap.get(currencyCode);
          if (codeData && codeData.exchange_rate > 0) {
            totalIncomeBase += stats.income / codeData.exchange_rate;
            totalOutcomeBase += stats.outcome / codeData.exchange_rate;
          } else {
            // If still no valid rate, skip this currency (log warning)
            console.warn(`No valid exchange rate for ${currencyCode}, skipping conversion`);
            // Don't add to totals to avoid incorrect calculations
          }
        } else {
          // Convert to base currency: divide by exchange_rate
          totalIncomeBase += stats.income / rate;
          totalOutcomeBase += stats.outcome / rate;
        }
      }
    }

    // If displayCurrency is specified and different from base, convert to display currency
    let totalIncome = totalIncomeBase;
    let totalOutcome = totalOutcomeBase;
    let displayCurrencyCode = baseCurrency;

    if (displayCurrency && displayCurrency !== baseCurrency) {
      const displayCurrencyData = currencyMap.get(displayCurrency);
      if (displayCurrencyData && displayCurrencyData.exchange_rate > 0) {
        // Convert from base to display currency: multiply by exchange_rate
        // Example: base=USD, display=IDR, rate=15000 means 1 USD = 15000 IDR
        // So to convert USD to IDR: amount * exchange_rate
        totalIncome = totalIncomeBase * displayCurrencyData.exchange_rate;
        totalOutcome = totalOutcomeBase * displayCurrencyData.exchange_rate;
        displayCurrencyCode = displayCurrency;
      }
    }

    return NextResponse.json({
      totalIncome,
      totalOutcome,
      balance: totalIncome - totalOutcome,
      currency: displayCurrencyCode,
      baseCurrency: baseCurrency,
      period: {
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

