import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// POST - Update exchange rates from external API
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's currencies
    const { data: currencies, error: currenciesError } = await supabase
      .from('currencies')
      .select('*')
      .eq('user_id', user.id);

    if (currenciesError || !currencies || currencies.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada currency untuk diupdate' },
        { status: 400 }
      );
    }

    // Find default currency (base currency)
    const defaultCurrency = currencies.find((c) => c.is_default);
    if (!defaultCurrency) {
      return NextResponse.json(
        { error: 'Default currency tidak ditemukan' },
        { status: 400 }
      );
    }

    // Get exchange rates from external API
    // Using exchangerate-api.com (free tier: 1500 requests/month)
    const baseCurrency = defaultCurrency.code;
    const targetCurrencies = currencies
      .filter((c) => !c.is_default)
      .map((c) => c.code)
      .join(',');

    try {
      // Using exchangerate-api.com free API (no API key required)
      const apiUrl = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
      const response = await fetch(apiUrl, {
        cache: 'no-store', // Don't cache for real-time rates
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const rates = data.rates || {};

      if (!rates || Object.keys(rates).length === 0) {
        throw new Error('No exchange rates returned from API');
      }

      // Update exchange rates
      const updates = [];
      for (const currency of currencies) {
        if (currency.is_default) {
          // Default currency always has rate 1.0
          if (currency.exchange_rate !== 1.0) {
            updates.push(
              supabase
                .from('currencies')
                .update({ exchange_rate: 1.0 })
                .eq('id', currency.id)
            );
          }
        } else {
          const rate = rates[currency.code];
          if (rate && rate !== currency.exchange_rate) {
            updates.push(
              supabase
                .from('currencies')
                .update({ exchange_rate: rate })
                .eq('id', currency.id)
            );
          }
        }
      }

      // Execute all updates
      await Promise.all(updates);

      // Fetch updated currencies
      const { data: updatedCurrencies, error: fetchError } = await supabase
        .from('currencies')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        return NextResponse.json(
          { error: 'Gagal mengambil data currency yang diupdate' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          message: 'Exchange rates berhasil diupdate',
          currencies: updatedCurrencies,
          last_updated: new Date().toISOString(),
        },
        { status: 200 }
      );
    } catch (apiError: any) {
      // Fallback: try alternative API (currencyapi.net)
      try {
        // Alternative: using currencyapi.net (free tier: 300 requests/month)
        const altApiUrl = `https://api.currencyapi.com/v3/latest?apikey=YOUR_API_KEY&base_currency=${baseCurrency}`;
        
        // For now, return error and suggest manual update
        return NextResponse.json(
          {
            error: 'Gagal mengambil exchange rate dari API. Silakan update manual atau coba lagi nanti.',
            details: apiError.message,
          },
          { status: 500 }
        );
      } catch (altError) {
        return NextResponse.json(
          {
            error: 'Gagal mengambil exchange rate. Silakan update manual.',
            details: apiError.message,
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

