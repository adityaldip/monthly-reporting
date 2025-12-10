import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// POST - Process recurring transactions (create transactions for due recurring transactions)
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Get all active recurring transactions that are due
    const { data: dueRecurring, error: fetchError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .lte('next_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 400 }
      );
    }

    const createdTransactions: any[] = [];
    const updatedRecurring: any[] = [];

    for (const recurring of dueRecurring || []) {
      // Check if transaction already exists for this date
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', recurring.next_date)
        .eq('amount', recurring.amount)
        .eq('type', recurring.type)
        .limit(1);

      if (existing && existing.length > 0) {
        // Transaction already exists, skip but update next_date
        const nextDate = calculateNextDate(recurring.next_date, recurring.frequency);
        await supabase
          .from('recurring_transactions')
          .update({ next_date: nextDate })
          .eq('id', recurring.id);
        continue;
      }

      // Create transaction
      const transactionData: any = {
        user_id: user.id,
        type: recurring.type,
        amount: recurring.amount,
        description: recurring.description || null,
        date: recurring.next_date,
      };

      if (recurring.currency_id) {
        transactionData.currency_id = recurring.currency_id;
        transactionData.currency = recurring.currency;
      } else {
        transactionData.currency = recurring.currency;
      }

      if (recurring.category_id) {
        transactionData.category_id = recurring.category_id;
        transactionData.category = recurring.category;
      } else {
        transactionData.category = recurring.category;
      }

      const { data: transaction, error: createError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (createError) {
        console.error(`Failed to create transaction for recurring ${recurring.id}:`, createError);
        continue;
      }

      createdTransactions.push(transaction);

      // Calculate and update next_date
      const nextDate = calculateNextDate(recurring.next_date, recurring.frequency);
      
      // Check if we've reached end_date
      let isActive = recurring.is_active;
      if (recurring.end_date && nextDate > recurring.end_date) {
        isActive = false;
      }

      const { data: updated } = await supabase
        .from('recurring_transactions')
        .update({ 
          next_date: nextDate,
          is_active: isActive,
        })
        .eq('id', recurring.id)
        .select()
        .single();

      if (updated) {
        updatedRecurring.push(updated);
      }
    }

    return NextResponse.json({
      message: `Created ${createdTransactions.length} transaction(s)`,
      createdTransactions,
      updatedRecurring,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

function calculateNextDate(currentDate: string, frequency: 'weekly' | 'monthly'): string {
  const date = new Date(currentDate);
  
  if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (frequency === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  }
  
  return date.toISOString().split('T')[0];
}

