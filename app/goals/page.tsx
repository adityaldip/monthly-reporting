'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Navbar from '@/components/Navbar';
import { Goal, GoalCreate } from '@/types/goal';
import { useI18n } from '@/lib/i18n/context';
import { useCurrency } from '@/lib/currency/context';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils/currency';

export default function GoalsPage() {
  const { t, language } = useI18n();
  const { currencies } = useCurrency();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  
  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalForm, setGoalForm] = useState<GoalCreate>({
    title: '',
    description: '',
    target_amount: 0,
    current_amount: 0,
    currency_id: '',
    deadline: '',
  });
  const [formattedTargetAmount, setFormattedTargetAmount] = useState('');
  const [formattedCurrentAmount, setFormattedCurrentAmount] = useState('');

  useEffect(() => {
    loadGoals();
  }, [filterStatus]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'all' 
        ? '/api/goals'
        : `/api/goals?status=${filterStatus}`;
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (response.ok) {
        setGoals(data.goals || []);
      } else {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: data.error || t.common.error,
        });
      }
    } catch (err) {
      console.error('Failed to load goals:', err);
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = () => {
    setEditingGoal(null);
    const locale = language === 'en' ? 'en-US' : 'id-ID';
    setGoalForm({
      title: '',
      description: '',
      target_amount: 0,
      current_amount: 0,
      currency_id: currencies.find(c => c.is_default)?.id || currencies[0]?.id || '',
      deadline: '',
    });
    setFormattedTargetAmount('');
    setFormattedCurrentAmount('');
    setShowGoalForm(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    const locale = language === 'en' ? 'en-US' : 'id-ID';
    setGoalForm({
      title: goal.title,
      description: goal.description || '',
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      currency_id: goal.currency_id,
      deadline: goal.deadline || '',
    });
    setFormattedTargetAmount(formatCurrencyInput(goal.target_amount.toString(), locale));
    setFormattedCurrentAmount(formatCurrencyInput(goal.current_amount.toString(), locale));
    setShowGoalForm(true);
  };

  const handleDeleteGoal = async (goal: Goal) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: t.common.warning,
      text: t.goals.confirmDelete,
      showCancelButton: true,
      confirmButtonText: t.common.yes,
      cancelButtonText: t.common.no,
      confirmButtonColor: '#EF4444',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/goals/${goal.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: t.common.success,
            text: t.goals.goalDeleted,
          });
          loadGoals();
        } else {
          Swal.fire({
            icon: 'error',
            title: t.common.error,
            text: data.error || t.common.error,
          });
        }
      } catch (err) {
        console.error('Failed to delete goal:', err);
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: t.common.error,
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goalSubmitting) return; // Prevent double submission

    if (!goalForm.title || !goalForm.target_amount || !goalForm.currency_id) {
      Swal.fire({
        icon: 'warning',
        title: t.common.warning,
        text: 'Please fill in all required fields',
      });
      return;
    }

    // Parse formatted amounts
    const locale = language === 'en' ? 'en-US' : 'id-ID';
    const targetAmount = parseCurrencyInput(formattedTargetAmount, locale);
    const currentAmount = parseCurrencyInput(formattedCurrentAmount, locale);

    if (targetAmount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: t.common.warning,
        text: 'Target amount must be greater than 0',
      });
      return;
    }
    if (currentAmount < 0) {
      Swal.fire({
        icon: 'warning',
        title: t.common.warning,
        text: 'Current amount cannot be negative',
      });
      return;
    }

    if (currentAmount > targetAmount) {
      Swal.fire({
        icon: 'warning',
        title: t.common.warning,
        text: 'Current amount cannot exceed target amount',
      });
      return;
    }

    setGoalSubmitting(true);
    try {
      const url = editingGoal ? `/api/goals/${editingGoal.id}` : '/api/goals';
      const method = editingGoal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...goalForm,
          target_amount: targetAmount,
          current_amount: currentAmount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: t.common.success,
          text: editingGoal ? t.goals.goalUpdated : t.goals.goalCreated,
        });
        setShowGoalForm(false);
        loadGoals();
      } else {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: data.error || t.common.error,
        });
      }
    } catch (err) {
      console.error('Failed to save goal:', err);
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
    } finally {
      setGoalSubmitting(false);
    }
  };

  const handleUpdateProgress = async (goal: Goal, newAmount: number) => {
    if (newAmount < 0) {
      Swal.fire({
        icon: 'warning',
        title: t.common.warning,
        text: 'Amount cannot be negative',
      });
      return;
    }

    if (newAmount > goal.target_amount) {
      Swal.fire({
        icon: 'warning',
        title: t.common.warning,
        text: 'Amount cannot exceed target amount',
      });
      return;
    }

    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          current_amount: newAmount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: t.common.success,
          text: t.goals.goalUpdated,
        });
        loadGoals();
      } else {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: data.error || t.common.error,
        });
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
    }
  };

  const handleStatusChange = async (goal: Goal, newStatus: 'active' | 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: t.common.success,
          text: t.goals.goalUpdated,
        });
        loadGoals();
      } else {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: data.error || t.common.error,
        });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
    }
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'active':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredGoals = goals;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">{t.common.loading}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.goals.title}</h1>
            <p className="mt-2 text-gray-600">{t.goals.subtitle}</p>
          </div>
          <button
            onClick={handleAddGoal}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition"
          >
            {t.goals.addGoal}
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filterStatus === 'all'
                ? 'bg-[#2563EB] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.goals.filterAll}
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filterStatus === 'active'
                ? 'bg-[#2563EB] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.goals.filterActive}
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filterStatus === 'completed'
                ? 'bg-[#2563EB] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.goals.filterCompleted}
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filterStatus === 'cancelled'
                ? 'bg-[#2563EB] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.goals.filterCancelled}
          </button>
        </div>

        {/* Goals Grid */}
        {filteredGoals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">{t.goals.noGoals}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => {
              const progress = goal.progress_percentage || 0;
              const isOverdue = goal.days_remaining !== null && goal.days_remaining !== undefined && goal.days_remaining < 0 && goal.status === 'active';
              
              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-[#2563EB]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {goal.title}
                      </h3>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                      )}
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(goal.status)}`}>
                        {goal.status === 'active' && isOverdue ? t.goals.overdue : t.goals[goal.status as keyof typeof t.goals]}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="text-[#2563EB] hover:text-[#1D4ED8]"
                        title={t.common.edit}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal)}
                        className="text-[#EF4444] hover:text-[#DC2626]"
                        title={t.common.delete}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">{t.goals.currentAmount}:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(goal.current_amount, goal.currency?.code || 'IDR')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">{t.goals.targetAmount}:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(goal.target_amount, goal.currency?.code || 'IDR')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-4">
                      <span className="text-gray-600">{t.goals.progress}:</span>
                      <span className="font-semibold text-gray-900">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progress >= 100
                            ? 'bg-green-500'
                            : progress >= 75
                            ? 'bg-yellow-500'
                            : 'bg-[#2563EB]'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  {goal.deadline && (
                    <div className="mb-4 text-sm">
                      {goal.days_remaining !== null && goal.days_remaining !== undefined && goal.days_remaining < 0 ? (
                        <span className="text-red-600 font-medium">
                          {t.goals.daysOverdue}: {Math.abs(goal.days_remaining)} {t.goals.daysRemaining}
                        </span>
                      ) : goal.days_remaining !== null && goal.days_remaining !== undefined ? (
                        <span className="text-gray-600">
                          {t.goals.daysRemaining}: {goal.days_remaining}
                        </span>
                      ) : (
                        <span className="text-gray-600">
                          {t.goals.deadline}: {new Date(goal.deadline).toLocaleDateString('id-ID')}
                        </span>
                      )}
                    </div>
                  )}

                  {goal.status === 'active' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newAmount = prompt(t.goals.updateProgress + ':', goal.current_amount.toString());
                          if (newAmount !== null) {
                            const amount = parseFloat(newAmount);
                            if (!isNaN(amount)) {
                              handleUpdateProgress(goal, amount);
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition text-sm"
                      >
                        {t.goals.updateProgress}
                      </button>
                      {progress >= 100 && (
                        <button
                          onClick={() => handleStatusChange(goal, 'completed')}
                          className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition text-sm"
                        >
                          {t.goals.markCompleted}
                        </button>
                      )}
                    </div>
                  )}

                  {goal.status === 'completed' && (
                    <button
                      onClick={() => handleStatusChange(goal, 'active')}
                      className="w-full px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition text-sm"
                    >
                      {t.goals.reactivate}
                    </button>
                  )}

                  {goal.status === 'cancelled' && (
                    <button
                      onClick={() => handleStatusChange(goal, 'active')}
                      className="w-full px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition text-sm"
                    >
                      {t.goals.reactivate}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Goal Form Modal */}
        {showGoalForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
              onClick={() => setShowGoalForm(false)}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingGoal ? t.goals.editGoal : t.goals.addGoal}
                  </h2>
                  <button
                    onClick={() => setShowGoalForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                    aria-label="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Goal Title */}
                    <div>
                      <label htmlFor="goal-title" className="block text-sm font-medium text-gray-900 mb-1">
                        {t.goals.goalTitle} <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        id="goal-title"
                        type="text"
                        value={goalForm.title}
                        onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                        required
                        placeholder={t.goals.goalTitle}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="goal-description" className="block text-sm font-medium text-gray-900 mb-1">
                        {t.goals.description}
                      </label>
                      <textarea
                        id="goal-description"
                        value={goalForm.description}
                        onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                        rows={3}
                        placeholder={t.goals.description}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 resize-none"
                      />
                    </div>

                    {/* Target Amount and Currency */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label htmlFor="target-amount" className="block text-sm font-medium text-gray-900 mb-1">
                          {t.goals.targetAmount} <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          id="target-amount"
                          type="text"
                          inputMode="decimal"
                          value={formattedTargetAmount}
                          onChange={(e) => {
                            const locale = language === 'en' ? 'en-US' : 'id-ID';
                            const formatted = formatCurrencyInput(e.target.value, locale);
                            setFormattedTargetAmount(formatted);
                          }}
                          required
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                        />
                      </div>
                      <div>
                        <label htmlFor="goal-currency" className="block text-sm font-medium text-gray-900 mb-1">
                          {t.goals.currency} <span className="text-[#EF4444]">*</span>
                        </label>
                        <select
                          id="goal-currency"
                          value={goalForm.currency_id}
                          onChange={(e) => setGoalForm({ ...goalForm, currency_id: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                        >
                          <option value="">{t.goals.currency}</option>
                          {currencies.map((curr) => (
                            <option key={curr.id} value={curr.id}>
                              {curr.code} {curr.symbol && `(${curr.symbol})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Current Amount */}
                    <div>
                      <label htmlFor="current-amount" className="block text-sm font-medium text-gray-900 mb-1">
                        {t.goals.currentAmount} <span className="text-gray-500 text-xs">(Opsional)</span>
                      </label>
                      <input
                        id="current-amount"
                        type="text"
                        inputMode="decimal"
                        value={formattedCurrentAmount}
                        onChange={(e) => {
                          const locale = language === 'en' ? 'en-US' : 'id-ID';
                          const formatted = formatCurrencyInput(e.target.value, locale);
                          setFormattedCurrentAmount(formatted);
                        }}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                      />
                    </div>

                    {/* Deadline */}
                    <div>
                      <label htmlFor="goal-deadline" className="block text-sm font-medium text-gray-900 mb-1">
                        {t.goals.deadline}
                      </label>
                      <input
                        id="goal-deadline"
                        type="date"
                        value={goalForm.deadline}
                        onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowGoalForm(false)}
                      disabled={goalSubmitting}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={goalSubmitting}
                      className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1E40AF] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {goalSubmitting && (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {goalSubmitting ? t.common.loading : editingGoal ? t.common.save : t.common.save}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
