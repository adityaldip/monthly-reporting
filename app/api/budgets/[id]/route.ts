import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { BudgetUpdate } from '@/types/budget';

// GET - Get single budget
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
      .from('budgets')
      .select(`
        *,
        category:categories(id, name, icon, color, type),
        currency:currencies(id, code, name, symbol)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Budget tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ budget: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// PUT - Update budget
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
    const body: BudgetUpdate = await request.json();
    const { category_id, year, month, amount, currency_id, alert_threshold } = body;

    // Verify budget exists and belongs to user
    const { data: existingBudget, error: fetchError } = await supabase
      .from('budgets')
      .select('id, category_id, year, month')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingBudget) {
      return NextResponse.json(
        { error: 'Budget tidak ditemukan' },
        { status: 404 }
      );
    }

    // Always check for duplicates when updating (even if values haven't changed, we need to check)
    // Use provided values or existing values
    const checkCategoryId = category_id !== undefined ? category_id : existingBudget.category_id;
    const checkYear = year !== undefined ? year : existingBudget.year;
    const checkMonth = month !== undefined ? month : existingBudget.month;

    // Check if another budget exists with same category, year, month (excluding current budget)
    const { data: duplicateBudget } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', user.id)
      .eq('category_id', checkCategoryId)
      .eq('year', checkYear)
      .eq('month', checkMonth)
      .neq('id', id)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error if no duplicate

    if (duplicateBudget) {
      return NextResponse.json(
        { error: 'Budget untuk kategori ini pada periode tersebut sudah ada' },
        { status: 400 }
      );
    }

    // Validate month if provided
    if (month !== undefined && (month < 1 || month > 12)) {
      return NextResponse.json(
        { error: 'Month harus antara 1 dan 12' },
        { status: 400 }
      );
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json(
        { error: 'Amount harus lebih dari 0' },
        { status: 400 }
      );
    }

    // Verify category if provided
    if (category_id) {
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

      if (category.type !== 'outcome') {
        return NextResponse.json(
          { error: 'Budget hanya bisa dibuat untuk kategori outcome' },
          { status: 400 }
        );
      }
    }

    // Verify currency if provided
    if (currency_id) {
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
    }

    const updateData: any = {};
    if (category_id !== undefined) updateData.category_id = category_id;
    if (year !== undefined) updateData.year = year;
    if (month !== undefined) updateData.month = month;
    if (amount !== undefined) updateData.amount = amount;
    if (currency_id !== undefined) updateData.currency_id = currency_id;
    if (alert_threshold !== undefined) updateData.alert_threshold = alert_threshold;

    const { data, error } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
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
        message: 'Budget berhasil diupdate',
        budget: data
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

// DELETE - Delete budget
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
      .from('budgets')
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
      { message: 'Budget berhasil dihapus' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

