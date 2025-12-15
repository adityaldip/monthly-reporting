import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// GET - Get account balances (calculated from transactions)
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all accounts for user
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, account_number, type, currency_id, is_default, created_at')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json(
        { error: accountsError.message || 'Gagal memuat accounts' },
        { status: 400 }
      );
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ accountBalances: [] }, { status: 200 });
    }

    // Get all transactions for these accounts
    // IMPORTANT: Calculate balance from ALL transactions (not just current month)
    // This should match the total balance shown in dashboard
    const accountIds = accounts.map(acc => acc.id);
    let transactions: any[] = [];
    
    if (accountIds.length > 0) {
      // Fetch ALL transactions for this user that have account_id (no date filter)
      // This ensures account balance matches total balance in dashboard
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('id, account_id, type, amount, currency_id')
        .eq('user_id', user.id)
        .not('account_id', 'is', null);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        return NextResponse.json(
          { error: transactionsError.message || 'Gagal memuat transaksi' },
          { status: 400 }
        );
      }
      
      transactions = transactionsData || [];
      console.log(`[BALANCES] Fetched ${transactions.length} total transactions with account_id (all time)`);
    }

    // Fetch ALL currencies (both account currencies and transaction currencies) for conversion
    const accountCurrencyIds = [...new Set(accounts.filter(acc => acc.currency_id).map(acc => acc.currency_id))];
    const transactionCurrencyIds = [...new Set(transactions.filter(tx => tx.currency_id).map(tx => tx.currency_id))];
    const allCurrencyIds = [...new Set([...accountCurrencyIds, ...transactionCurrencyIds])];
    
    const currencyMap = new Map();
    let currenciesData: any[] = [];
    
    if (allCurrencyIds.length > 0) {
      const { data: currenciesDataResult } = await supabase
        .from('currencies')
        .select('id, code, symbol, exchange_rate, is_default')
        .in('id', allCurrencyIds)
        .eq('user_id', user.id);
      
      currenciesData = currenciesDataResult || [];
      currenciesData.forEach((curr) => {
        currencyMap.set(curr.id, curr);
        currencyMap.set(curr.code, curr); // Also store by code for lookup
      });
      
      console.log(`[BALANCES] Loaded ${currenciesData.length} currencies for conversion`);
    }
    
    // Get base currency (default currency)
    let baseCurrency: any = null;
    if (currenciesData.length > 0) {
      baseCurrency = currenciesData.find((c: any) => c.is_default) || currenciesData[0];
    }
    if (!baseCurrency) {
      console.warn('[BALANCES] No base currency found, using first currency or IDR');
    }

    // Calculate balance for each account
    const accountBalances = accounts.map((account) => {
      // Filter transactions for this account (handle UUID comparison more robustly)
      const accountTransactions = transactions?.filter(tx => {
        if (!tx.account_id) return false;
        // Try multiple comparison methods
        const txAccountId = String(tx.account_id).trim();
        const accId = String(account.id).trim();
        return txAccountId === accId || tx.account_id === account.id;
      }) || [];
      
      // Get account currency
      const accountCurrency = account.currency_id && currencyMap.has(account.currency_id)
        ? currencyMap.get(account.currency_id)
        : null;
      
      const accountCurrencyCode = accountCurrency?.code || 'IDR';
      const accountCurrencyRate = accountCurrency?.exchange_rate || 1;
      
      // Calculate balance by converting all transactions to account currency
      let balance = 0;
      accountTransactions.forEach((tx) => {
        const txAmount = parseFloat(tx.amount?.toString() || '0');
        
        // Get transaction currency
        let txCurrency = null;
        if (tx.currency_id) {
          txCurrency = currencyMap.get(tx.currency_id);
        }
        
        const txCurrencyCode = txCurrency?.code || accountCurrencyCode;
        const txCurrencyRate = txCurrency?.exchange_rate || 1;
        
        // Convert transaction amount to account currency
        let convertedAmount = txAmount;
        
        if (txCurrencyCode !== accountCurrencyCode) {
          // Need to convert: tx currency -> base currency -> account currency
          // Step 1: Convert tx currency to base currency
          let baseAmount = txAmount;
          if (txCurrencyRate > 0 && txCurrencyCode !== baseCurrency?.code) {
            baseAmount = txAmount / txCurrencyRate;
          }
          
          // Step 2: Convert base currency to account currency
          if (accountCurrencyRate > 0 && accountCurrencyCode !== baseCurrency?.code) {
            convertedAmount = baseAmount * accountCurrencyRate;
          } else {
            convertedAmount = baseAmount;
          }
          
          console.log(`[BALANCES] Converting ${txAmount} ${txCurrencyCode} to ${convertedAmount} ${accountCurrencyCode} (tx_rate: ${txCurrencyRate}, acc_rate: ${accountCurrencyRate})`);
        }
        
        if (tx.type === 'income') {
          balance += convertedAmount;
        } else if (tx.type === 'outcome') {
          balance -= convertedAmount;
        }
      });

      console.log(`[BALANCES] Account ${account.name} (${accountCurrencyCode}): ${accountTransactions.length} transactions, balance: ${balance}`);
      
      // Debug: log sample transactions if any
      if (accountTransactions.length > 0) {
        const sampleTx = accountTransactions[0];
        const sampleTxCurrency = sampleTx.currency_id ? currencyMap.get(sampleTx.currency_id) : null;
        console.log(`[BALANCES] Sample transaction for ${account.name}:`, {
          id: sampleTx.id,
          type: sampleTx.type,
          amount: sampleTx.amount,
          currency: sampleTxCurrency?.code || 'unknown',
          account_id: sampleTx.account_id
        });
      }

      return {
        ...account,
        currency: accountCurrency,
        balance: balance,
        transactionCount: accountTransactions.length,
      };
    });

    return NextResponse.json({ accountBalances }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
