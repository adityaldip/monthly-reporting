import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { GoalUpdate } from '@/types/goal';

// GET - Get a specific goal
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
    const { data: goal, error } = await supabase
      .from('goals')
      .select(`
        *,
        currency:currencies(id, code, name, symbol, exchange_rate)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    // Calculate progress
    const progress = goal.target_amount > 0 
      ? (goal.current_amount / goal.target_amount) * 100 
      : 0;

    let daysRemaining = null;
    if (goal.deadline) {
      const today = new Date();
      const deadline = new Date(goal.deadline);
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemaining = diffDays;
    }

    return NextResponse.json({
      goal: {
        ...goal,
        progress_percentage: Math.min(100, Math.max(0, progress)),
        days_remaining: daysRemaining,
      },
    });
  } catch (error: any) {
    console.error('Error fetching goal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch goal' },
      { status: 500 }
    );
  }
}

// PUT - Update a goal
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
    const body: GoalUpdate = await request.json();
    const { title, description, target_amount, current_amount, currency_id, deadline, status } = body;

    // First, get the existing goal to validate
    const { data: existingGoal, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingGoal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Prepare update object
    const updates: any = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (target_amount !== undefined) {
      if (target_amount <= 0) {
        return NextResponse.json(
          { error: 'Target amount must be greater than 0' },
          { status: 400 }
        );
      }
      updates.target_amount = target_amount;
    }
    if (current_amount !== undefined) {
      if (current_amount < 0) {
        return NextResponse.json(
          { error: 'Current amount cannot be negative' },
          { status: 400 }
        );
      }
      const finalTarget = target_amount !== undefined ? target_amount : existingGoal.target_amount;
      if (current_amount > finalTarget) {
        return NextResponse.json(
          { error: 'Current amount cannot exceed target amount' },
          { status: 400 }
        );
      }
      updates.current_amount = current_amount;
    }
    if (currency_id !== undefined) updates.currency_id = currency_id;
    if (deadline !== undefined) {
      if (deadline) {
        const deadlineDate = new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadlineDate < today) {
          return NextResponse.json(
            { error: 'Deadline cannot be in the past' },
            { status: 400 }
          );
        }
      }
      updates.deadline = deadline || null;
    }
    if (status !== undefined) {
      if (!['active', 'completed', 'cancelled'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    // Auto-complete if current_amount >= target_amount
    const finalCurrentAmount = current_amount !== undefined ? current_amount : existingGoal.current_amount;
    const finalTargetAmount = target_amount !== undefined ? target_amount : existingGoal.target_amount;
    if (finalCurrentAmount >= finalTargetAmount && updates.status !== 'cancelled') {
      updates.status = 'completed';
    }

    const { data: goal, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        currency:currencies(id, code, name, symbol, exchange_rate)
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Calculate progress
    const progress = goal.target_amount > 0 
      ? (goal.current_amount / goal.target_amount) * 100 
      : 0;

    let daysRemaining = null;
    if (goal.deadline) {
      const today = new Date();
      const deadline = new Date(goal.deadline);
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemaining = diffDays;
    }

    return NextResponse.json({
      goal: {
        ...goal,
        progress_percentage: Math.min(100, Math.max(0, progress)),
        days_remaining: daysRemaining,
      },
      message: 'Goal updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a goal
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
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
