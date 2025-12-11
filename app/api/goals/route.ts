import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { GoalCreate } from '@/types/goal';

// GET - Get all goals for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('goals')
      .select(`
        *,
        currency:currencies(id, code, name, symbol, exchange_rate)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: goals, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Enrich goals with progress and days remaining
    const enrichedGoals = (goals || []).map((goal: any) => {
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

      // Auto-update status based on progress or deadline
      let finalStatus = goal.status;
      if (goal.status === 'active') {
        if (progress >= 100) {
          finalStatus = 'completed';
        } else if (goal.deadline && daysRemaining !== null && daysRemaining < 0) {
          // Deadline passed but not completed
          // Keep as active, but could be marked as overdue in UI
        }
      }

      return {
        ...goal,
        progress_percentage: Math.min(100, Math.max(0, progress)),
        days_remaining: daysRemaining,
        status: finalStatus,
      };
    });

    return NextResponse.json({ goals: enrichedGoals });
  } catch (error: any) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: GoalCreate = await request.json();
    const { title, description, target_amount, current_amount = 0, currency_id, deadline } = body;

    // Validation
    if (!title || !target_amount || !currency_id) {
      return NextResponse.json(
        { error: 'Title, target amount, and currency are required' },
        { status: 400 }
      );
    }

    if (target_amount <= 0) {
      return NextResponse.json(
        { error: 'Target amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (current_amount < 0) {
      return NextResponse.json(
        { error: 'Current amount cannot be negative' },
        { status: 400 }
      );
    }

    if (current_amount > target_amount) {
      return NextResponse.json(
        { error: 'Current amount cannot exceed target amount' },
        { status: 400 }
      );
    }

    // Validate deadline if provided
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

    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title,
        description,
        target_amount,
        current_amount,
        currency_id,
        deadline: deadline || null,
        status: 'active',
      })
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
      message: 'Goal created successfully',
    });
  } catch (error: any) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create goal' },
      { status: 500 }
    );
  }
}
