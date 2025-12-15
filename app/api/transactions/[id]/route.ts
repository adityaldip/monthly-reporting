import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { TransactionUpdate, getIncomeCategories, getOutcomeCategories } from '@/types/transaction';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// GET - Get single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Enrich with account data if account_id exists
    let enrichedTransaction: any = { ...data };
    if (data.account_id) {
      const { data: accountData } = await supabase
        .from('accounts')
        .select('id, name, account_number, type')
        .eq('id', data.account_id)
        .eq('user_id', user.id)
        .single();
      
      if (accountData) {
        enrichedTransaction.account = accountData;
      }
    }

    return NextResponse.json({ transaction: enrichedTransaction }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// PUT - Update transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: TransactionUpdate = await request.json();
    const { type, amount, currency, currency_id, description, category, category_id, account_id, date } = body;

    // Validate if transaction exists and belongs to user
    const { data: existing, error: checkError } = await supabase
      .from('transactions')
      .select('id, type')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Determine the type to use for validation (use updated type or existing type)
    const transactionType = type !== undefined ? type : existing.type;

    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (amount !== undefined) {
      if (amount <= 0) {
        return NextResponse.json(
          { error: 'Amount harus lebih dari 0' },
          { status: 400 }
        );
      }
      updateData.amount = amount;
    }
    // Handle currency_id first (new format), then currency (legacy format)
    // currency_id takes precedence over currency
    if (currency_id !== undefined && currency_id !== null) {
      // Only update if currency_id is a non-empty string
      if (currency_id && typeof currency_id === 'string' && currency_id.trim() !== '') {
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
        updateData.currency_id = currency_id;
        updateData.currency = currencyData.code; // Update legacy field
      } else if (currency_id === '' || currency_id === null) {
        // Explicitly set to null if empty string or null is provided
        updateData.currency_id = null;
      }
      // If currency_id is undefined, don't update it (keep existing value)
    } else if (currency !== undefined) {
      // Only use legacy currency if currency_id is not provided
      updateData.currency = currency;
    }
    if (description !== undefined) updateData.description = description || null;
    if (category !== undefined) {
      // Validate category based on transaction type
      if (transactionType === 'income') {
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
      updateData.category = category;
    }
    if (category_id !== undefined && category_id !== null) {
      // Only update if category_id is a non-empty string
      if (category_id && typeof category_id === 'string' && category_id.trim() !== '') {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, type, name')
          .eq('id', category_id)
          .eq('user_id', user.id)
          .single();

        if (categoryError || !categoryData) {
          return NextResponse.json(
            { error: 'Category tidak ditemukan' },
            { status: 400 }
          );
        }

        if (categoryData.type !== transactionType) {
          return NextResponse.json(
            { error: `Category type tidak sesuai dengan transaction type` },
            { status: 400 }
          );
        }

        updateData.category_id = category_id;
        updateData.category = categoryData.name; // Update legacy field
      } else if (category_id === '' || category_id === null) {
        // Explicitly set to null if empty string or null is provided
        updateData.category_id = null;
      }
      // If category_id is undefined, don't update it (keep existing value)
    }
    if (account_id !== undefined && account_id !== null) {
      // Only update if account_id is a non-empty string
      if (account_id && typeof account_id === 'string' && account_id.trim() !== '') {
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
        updateData.account_id = account_id;
      } else if (account_id === '' || account_id === null) {
        // Explicitly set to null if empty string or null is provided
        updateData.account_id = null;
      }
      // If account_id is undefined, don't update it (keep existing value)
    }
    if (date !== undefined) updateData.date = date;

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
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
        message: 'Transaksi berhasil diupdate',
        transaction: data
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// DELETE - Delete transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Transaksi berhasil dihapus' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

