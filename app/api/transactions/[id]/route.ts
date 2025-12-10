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

    return NextResponse.json({ transaction: data }, { status: 200 });
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
    const { type, amount, currency, description, category, date } = body;

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
    if (currency !== undefined) updateData.currency = currency;
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

