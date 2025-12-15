import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// POST - Transfer between accounts
// This creates 2 transactions: outcome from source account, income to destination account
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { from_account_id, to_account_id, amount, currency_id, description, date } = body;

    // Validation
    if (!from_account_id || !to_account_id) {
      return NextResponse.json(
        { error: 'Account sumber dan tujuan wajib diisi' },
        { status: 400 }
      );
    }

    if (from_account_id === to_account_id) {
      return NextResponse.json(
        { error: 'Account sumber dan tujuan tidak boleh sama' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount harus lebih dari 0' },
        { status: 400 }
      );
    }

    if (!currency_id) {
      return NextResponse.json(
        { error: 'Currency wajib diisi' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date wajib diisi' },
        { status: 400 }
      );
    }

    // Validate accounts exist and belong to user
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name')
      .in('id', [from_account_id, to_account_id])
      .eq('user_id', user.id);

    if (accountsError || !accounts || accounts.length !== 2) {
      return NextResponse.json(
        { error: 'Account tidak ditemukan atau tidak valid' },
        { status: 400 }
      );
    }

    const fromAccount = accounts.find(a => a.id === from_account_id);
    const toAccount = accounts.find(a => a.id === to_account_id);

    if (!fromAccount || !toAccount) {
      return NextResponse.json(
        { error: 'Account tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validate currency exists and belongs to user
    const { data: currencyData, error: currencyError } = await supabase
      .from('currencies')
      .select('id, code')
      .eq('id', currency_id)
      .eq('user_id', user.id)
      .single();

    if (currencyError || !currencyData) {
      return NextResponse.json(
        { error: 'Currency tidak ditemukan' },
        { status: 400 }
      );
    }

    // Create transfer description
    const transferDescription = description 
      ? `Transfer: ${description}`
      : `Transfer dari ${fromAccount.name} ke ${toAccount.name}`;

    // Create 2 transactions in a transaction (database transaction)
    // 1. Outcome from source account
    // 2. Income to destination account

    // Get or create "Transfer" category for both outcome and income
    let transferOutcomeCategoryId: string | null = null;
    let transferIncomeCategoryId: string | null = null;

    // Helper function to get or create Transfer category
    const getOrCreateTransferCategory = async (type: 'income' | 'outcome'): Promise<string | null> => {
      // First, try to find existing "Transfer" category (case-insensitive, exact match preferred)
      const { data: exactMatch } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', type)
        .eq('name', 'Transfer')
        .maybeSingle();

      if (exactMatch) {
        return exactMatch.id;
      }

      // Try case-insensitive search
      const { data: caseInsensitive } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', type)
        .ilike('name', 'Transfer')
        .maybeSingle();

      if (caseInsensitive) {
        return caseInsensitive.id;
      }

      // Create "Transfer" category
      const { data: newCategory, error: createError } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          type: type,
          name: 'Transfer',
          icon: '🔄',
          color: '#2563EB',
          is_default: false,
        })
        .select('id')
        .maybeSingle();

      if (!createError && newCategory) {
        return newCategory.id;
      }

      // If insert fails (maybe duplicate constraint), try to find again
      const { data: retryFind } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', type)
        .eq('name', 'Transfer')
        .maybeSingle();

      if (retryFind) {
        return retryFind.id;
      }

      // Last resort: return null (will be handled below)
      return null;
    };

    // Get Transfer categories
    transferOutcomeCategoryId = await getOrCreateTransferCategory('outcome');
    transferIncomeCategoryId = await getOrCreateTransferCategory('income');

    if (!transferOutcomeCategoryId || !transferIncomeCategoryId) {
      return NextResponse.json(
        { error: 'Category untuk outcome dan income tidak ditemukan. Silakan buat category terlebih dahulu di Settings.' },
        { status: 400 }
      );
    }

    // Insert both transactions
    const { data: transactions, error: insertError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'outcome',
          amount: amount,
          currency_id: currency_id,
          currency: currencyData.code,
          category_id: transferOutcomeCategoryId,
          account_id: from_account_id,
          description: transferDescription,
          date: date,
        },
        {
          user_id: user.id,
          type: 'income',
          amount: amount,
          currency_id: currency_id,
          currency: currencyData.code,
          category_id: transferIncomeCategoryId,
          account_id: to_account_id,
          description: transferDescription,
          date: date,
        },
      ])
      .select();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Transfer berhasil dilakukan',
        transactions: transactions,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
