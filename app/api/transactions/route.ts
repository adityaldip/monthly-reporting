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

    // Get transactions (ensure account_id is included)
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

    // Debug: Check if account_id exists in raw transactions
    if (transactions && transactions.length > 0) {
      const txWithAccountId = transactions.find((tx: any) => tx.account_id);
      if (txWithAccountId) {
        console.log('Sample transaction with account_id:', {
          id: txWithAccountId.id,
          account_id: txWithAccountId.account_id,
          account_id_type: typeof txWithAccountId.account_id
        });
      }
    }

    // Optimize: Batch fetch all currencies, categories, and accounts instead of N+1 queries
    const currencyIds = [...new Set((transactions || []).filter(tx => tx.currency_id).map(tx => tx.currency_id))];
    const categoryIds = [...new Set((transactions || []).filter(tx => tx.category_id).map(tx => tx.category_id))];
    const accountIds = [...new Set((transactions || []).filter(tx => {
      const accountId = (tx as any).account_id;
      return accountId && accountId !== null && accountId !== '' && accountId !== undefined;
    }).map(tx => (tx as any).account_id))];
    
    // Debug: log account IDs found
    console.log(`Found ${accountIds.length} unique account IDs in ${transactions?.length || 0} transactions:`, accountIds);

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

    // Batch fetch accounts
    const accountMap = new Map();
    if (accountIds.length > 0) {
      console.log(`[ACCOUNTS] Fetching accounts for IDs:`, accountIds, `for user:`, user.id);
      
      // First, try to fetch all accounts for this user to see what exists
      const { data: allUserAccounts, error: allUserAccountsError } = await supabase
        .from('accounts')
        .select('id, name, account_number, type, user_id')
        .eq('user_id', user.id);
      
      if (allUserAccountsError) {
        console.error('[ACCOUNTS] Error fetching all user accounts:', allUserAccountsError);
      } else {
        console.log(`[ACCOUNTS] User has ${allUserAccounts?.length || 0} total accounts:`, allUserAccounts?.map(a => ({ id: a.id, name: a.name })));
      }
      
      // Now fetch specific accounts by IDs
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id, name, account_number, type')
        .in('id', accountIds)
        .eq('user_id', user.id);
      
      console.log(`[ACCOUNTS] Query result - error:`, accountsError, `data length:`, accountsData?.length || 0);
      
      if (accountsError) {
        console.error('[ACCOUNTS] Error fetching accounts:', accountsError);
        console.error('[ACCOUNTS] Error details:', JSON.stringify(accountsError, null, 2));
        // Don't return error, just log it - transactions can still be returned without account info
      } else if (accountsData && accountsData.length > 0) {
        console.log(`[ACCOUNTS] Successfully fetched ${accountsData.length} accounts:`, accountsData.map(a => ({ id: a.id, name: a.name })));
        accountsData.forEach((acc) => {
          // Store with both string and original ID as key to handle type mismatches
          const accIdStr = String(acc.id);
          accountMap.set(accIdStr, acc);
          accountMap.set(acc.id, acc); // Also store with original type
          // Also try with trimmed string in case of whitespace issues
          accountMap.set(accIdStr.trim(), acc);
        });
        
        // Debug: log account mapping
        console.log(`[ACCOUNTS] Account map now has ${accountMap.size} entries. Keys:`, Array.from(accountMap.keys()).slice(0, 10));
      } else {
        // No data returned or empty array
        console.warn('[ACCOUNTS] No accounts data returned for account IDs:', accountIds);
        console.warn('[ACCOUNTS] accountsData value:', accountsData);
        console.warn('[ACCOUNTS] accountsData type:', typeof accountsData, Array.isArray(accountsData));
        
        // Check if the account IDs match any user accounts
        if (allUserAccounts && allUserAccounts.length > 0) {
          const matchingAccounts = allUserAccounts.filter(acc => accountIds.includes(String(acc.id)) || accountIds.includes(acc.id));
          console.log(`[ACCOUNTS] Found ${matchingAccounts.length} matching accounts from all user accounts:`, matchingAccounts.map(a => ({ id: a.id, name: a.name })));
          
          if (matchingAccounts.length > 0) {
            // Use the matching accounts even though the query didn't return them
            console.warn('[ACCOUNTS] Using accounts from allUserAccounts query instead');
            matchingAccounts.forEach((acc) => {
              const accIdStr = String(acc.id);
              accountMap.set(accIdStr, { id: acc.id, name: acc.name, account_number: acc.account_number, type: acc.type });
              accountMap.set(acc.id, { id: acc.id, name: acc.name, account_number: acc.account_number, type: acc.type });
              accountMap.set(accIdStr.trim(), { id: acc.id, name: acc.name, account_number: acc.account_number, type: acc.type });
            });
            console.log(`[ACCOUNTS] Account map now has ${accountMap.size} entries after fallback`);
          } else {
            const missingIds = accountIds.filter(id => {
              const idStr = String(id);
              return !allUserAccounts?.some(acc => String(acc.id) === idStr || acc.id === id);
            });
            if (missingIds.length > 0) {
              console.warn('[ACCOUNTS] Account IDs not found in user accounts:', missingIds);
              console.warn('[ACCOUNTS] These account IDs are in transactions but not in accounts table for this user');
            }
          }
        }
      }
    } else {
      console.log('[ACCOUNTS] No account IDs to fetch');
    }

    // Enrich transactions with currency, category, and account info from maps
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

      // Get account info from map
      const accountId = (tx as any).account_id;
      if (accountId) {
        // Convert to string for comparison (in case of UUID type mismatch)
        const accountIdStr = String(accountId).trim();
        let foundAccount = null;
        
        // Try multiple matching strategies
        if (accountMap.has(accountIdStr)) {
          foundAccount = accountMap.get(accountIdStr);
        } else if (accountMap.has(accountId)) {
          foundAccount = accountMap.get(accountId);
        } else if (accountMap.has(String(accountId))) {
          foundAccount = accountMap.get(String(accountId));
        } else {
          // Try to find by iterating (in case of type mismatch)
          for (const [key, value] of accountMap.entries()) {
            const keyStr = String(key).trim();
            const valueIdStr = String(value.id).trim();
            if (keyStr === accountIdStr || valueIdStr === accountIdStr) {
              foundAccount = value;
              break;
            }
          }
        }
        
        if (foundAccount) {
          enriched.account = foundAccount;
          // Debug: log successful enrichment
          if (tx.id === transactions?.[0]?.id) { // Only log for first transaction to avoid spam
            console.log(`Successfully enriched transaction ${tx.id} with account:`, foundAccount.name);
          }
        } else {
          // Debug: log if account_id exists but not found in map
          console.warn(`Transaction ${tx.id} has account_id ${accountId} (type: ${typeof accountId}, string: "${accountIdStr}") but account not found in map. Account IDs requested: ${accountIds.join(', ')}, Account map size: ${accountMap.size}, Sample map keys:`, Array.from(accountMap.keys()).slice(0, 5));
        }
      }

      return enriched;
    });

    // Debug: Check final enriched transactions
    const enrichedWithAccount = enrichedTransactions.filter((tx: any) => tx.account);
    console.log(`Enriched ${enrichedWithAccount.length} out of ${enrichedTransactions.length} transactions with account data`);

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
    const { type, amount, currency, currency_id, description, category, category_id, account_id, date } = body;

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

    // Add account_id if provided
    if (account_id) {
      // Validate account_id exists and belongs to user
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', account_id)
        .eq('user_id', user.id)
        .single();

      if (accountError || !accountData) {
        return NextResponse.json(
          { error: 'Account tidak ditemukan' },
          { status: 400 }
        );
      }

      insertData.account_id = account_id;
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

