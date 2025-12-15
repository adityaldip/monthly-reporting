'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Navbar from '@/components/Navbar';
import { Currency, CurrencyCreate } from '@/types/currency';
import { Category, CategoryCreate } from '@/types/category';
import { Budget, BudgetCreate } from '@/types/budget';
import { Account, AccountCreate, AccountType } from '@/types/account';
import { WORLDWIDE_CURRENCIES, getCurrencyByCode } from '@/lib/currencies';
import { useI18n } from '@/lib/i18n/context';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils/currency';

export default function SettingsPage() {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<'currencies' | 'categories' | 'budgets' | 'accounts'>('currencies');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRates, setUpdatingRates] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form loading states
  const [currencySubmitting, setCurrencySubmitting] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);
  const [accountSubmitting, setAccountSubmitting] = useState(false);

  // Currency form
  const [showCurrencyForm, setShowCurrencyForm] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [currencyForm, setCurrencyForm] = useState<CurrencyCreate>({
    code: '',
    name: '',
    symbol: '',
    is_default: false,
    exchange_rate: 1.0,
  });

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryCreate>({
    type: 'income',
    name: '',
    icon: '',
    color: '#3B82F6',
    is_default: false,
  });

  // Budget form
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [budgetForm, setBudgetForm] = useState<{
    category_id: string;
    year: number;
    month: number;
    amount: string; // Use string to allow empty input
    currency_id: string;
    alert_threshold: string; // Use string to allow empty input
  }>({
    category_id: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amount: '',
    currency_id: '',
    alert_threshold: '80',
  });

  // Account form
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountForm, setAccountForm] = useState<AccountCreate>({
    name: '',
    type: 'cash',
    account_number: '',
    currency_id: '',
    description: '',
    is_default: false,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'currencies') {
        const response = await fetch('/api/currencies', {
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          const errorMsg = data.error || t.common.error;
          setError(errorMsg);
          Swal.fire({
            icon: 'error',
            title: t.common.error,
            text: errorMsg,
          });
          return;
        }
        setCurrencies(data.currencies || []);
      } else if (activeTab === 'categories') {
        const response = await fetch('/api/categories', {
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          const errorMsg = data.error || t.common.error;
          setError(errorMsg);
          Swal.fire({
            icon: 'error',
            title: t.common.error,
            text: errorMsg,
          });
          return;
        }
        setCategories(data.categories || []);
      } else if (activeTab === 'budgets') {
        // Load all budgets without filtering by year/month
        const response = await fetch(
          `/api/budgets`,
          { credentials: 'include' }
        );
        const data = await response.json();
        if (!response.ok) {
          const errorMsg = data.error || t.common.error;
          setError(errorMsg);
          Swal.fire({
            icon: 'error',
            title: t.common.error,
            text: errorMsg,
          });
          return;
        }
        setBudgets(data.budgets || []);
        // Also load categories and currencies for dropdowns
        const [catRes, currRes] = await Promise.all([
          fetch('/api/categories?type=outcome', { credentials: 'include' }),
          fetch('/api/currencies', { credentials: 'include' }),
        ]);
        const [catData, currData] = await Promise.all([catRes.json(), currRes.json()]);
        if (catRes.ok) setCategories(catData.categories || []);
        if (currRes.ok) setCurrencies(currData.currencies || []);
      } else if (activeTab === 'accounts') {
        const response = await fetch('/api/accounts', {
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          const errorMsg = data.error || t.common.error;
          setError(errorMsg);
          Swal.fire({
            icon: 'error',
            title: t.common.error,
            text: errorMsg,
          });
          return;
        }
        setAccounts(data.accounts || []);
        // Also load currencies for dropdown
        const currRes = await fetch('/api/currencies', { credentials: 'include' });
        const currData = await currRes.json();
        if (currRes.ok) setCurrencies(currData.currencies || []);
      }
    } catch (err) {
      const errorMsg = t.common.error;
      setError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currencySubmitting) return; // Prevent double submission
    
    setError('');
    setSuccess('');
    setCurrencySubmitting(true);

    try {
      const url = editingCurrency
        ? `/api/currencies/${editingCurrency.id}`
        : '/api/currencies';
      const method = editingCurrency ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(currencyForm),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: data.error || t.common.error,
        });
        setError(data.error || t.common.error);
        setCurrencySubmitting(false);
        return;
      }

      Swal.fire({
        icon: 'success',
        title: t.common.success,
        text: data.message || t.common.success,
        timer: 2000,
        showConfirmButton: false,
      });
      setShowCurrencyForm(false);
      setEditingCurrency(null);
      setCurrencyForm({
        code: '',
        name: '',
        symbol: '',
        is_default: false,
        exchange_rate: 1.0,
      });
      setCurrencySubmitting(false);
      loadData();
    } catch (err) {
      console.error('Error submitting currency:', err);
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
      setError(t.common.error);
      setCurrencySubmitting(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categorySubmitting) return; // Prevent double submission
    
    setError('');
    setSuccess('');
    setCategorySubmitting(true);

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(categoryForm),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: data.error || t.common.error,
        });
        setError(data.error || t.common.error);
        setCategorySubmitting(false);
        return;
      }

      Swal.fire({
        icon: 'success',
        title: t.common.success,
        text: data.message || t.common.success,
        timer: 2000,
        showConfirmButton: false,
      });
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({
        type: 'income',
        name: '',
        icon: '',
        color: '#3B82F6',
        is_default: false,
      });
      setCategorySubmitting(false);
      loadData();
    } catch (err) {
      console.error('Error submitting category:', err);
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
      setError(t.common.error);
      setCategorySubmitting(false);
    }
  };

  const handleDeleteCurrency = async (id: string) => {
    const result = await Swal.fire({
      title: t.settings.confirmDelete,
      text: t.settings.confirmDeleteCurrency,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t.common.yes,
      cancelButtonText: t.common.cancel,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/currencies/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: data.error || t.common.error,
        });
        setError(data.error || t.common.error);
        return;
      }

      const deleteData = await response.json();
      Swal.fire({
        icon: 'success',
        title: t.common.success,
        text: deleteData.message || t.common.success,
        timer: 2000,
        showConfirmButton: false,
      });
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
      setError(t.common.error);
    }
  };

  const handleUpdateExchangeRates = async () => {
    setUpdatingRates(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/currencies/update-rates', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.common.error);
        return;
      }

      Swal.fire({
        icon: 'success',
        title: t.common.success,
        text: data.message || t.common.success,
        timer: 2000,
        showConfirmButton: false,
      });
      setCurrencies(data.currencies || []);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
      setError(t.common.error);
    } finally {
      setUpdatingRates(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const result = await Swal.fire({
      title: t.settings.confirmDelete,
      text: t.settings.confirmDeleteCategory,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t.common.yes,
      cancelButtonText: t.common.cancel,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: data.error || t.common.error,
        });
        setError(data.error || t.common.error);
        return;
      }

      Swal.fire({
        icon: 'success',
        title: t.common.success,
        text: data.message || t.common.success,
        timer: 2000,
        showConfirmButton: false,
      });
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
      setError(t.common.error);
    }
  };

  const openEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol || '',
      is_default: currency.is_default,
      exchange_rate: currency.exchange_rate,
    });
    setShowCurrencyForm(true);
  };

  const handleCurrencyCodeChange = async (code: string) => {
    const currencyInfo = getCurrencyByCode(code);
    if (currencyInfo) {
      // Auto-fetch exchange rate if not editing and default currency exists
      if (!editingCurrency) {
        const defaultCurrency = currencies.find((c) => c.is_default);
        let exchangeRate = 1.0;

        if (defaultCurrency && defaultCurrency.code !== code) {
          try {
            // Fetch exchange rate from API
            const apiUrl = `https://api.exchangerate-api.com/v4/latest/${defaultCurrency.code}`;
            const response = await fetch(apiUrl);
            if (response.ok) {
              const data = await response.json();
              const rate = data.rates?.[code];
              if (rate) {
                exchangeRate = rate;
              }
            }
          } catch (err) {
            // If API fails, keep default rate 1.0
            console.error('Failed to fetch exchange rate:', err);
          }
        }

        // Update form with all data at once
        setCurrencyForm({
          ...currencyForm,
          code: currencyInfo.code,
          name: currencyInfo.name,
          symbol: currencyInfo.symbol,
          exchange_rate: exchangeRate,
        });
      } else {
        // When editing, only update code, name, symbol (keep existing exchange_rate)
        setCurrencyForm({
          ...currencyForm,
          code: currencyInfo.code,
          name: currencyInfo.name,
          symbol: currencyInfo.symbol,
        });
      }
    }
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      type: category.type,
      name: category.name,
      icon: category.icon || '',
      color: category.color || '#3B82F6',
      is_default: category.is_default,
    });
    setShowCategoryForm(true);
  };

  // Budget functions
  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetSubmitting) return; // Prevent double submission
    
    setError('');
    setSuccess('');
    setBudgetSubmitting(true);

    // Validate and parse amount
    const locale = language === 'en' ? 'en-US' : 'id-ID';
    const amountValue = parseCurrencyInput(budgetForm.amount, locale);
    if (!amountValue || amountValue <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Amount harus lebih dari 0',
      });
      setBudgetSubmitting(false);
      return;
    }

    // Parse alert threshold (default to 80 if empty)
    const alertThresholdValue = budgetForm.alert_threshold 
      ? parseFloat(budgetForm.alert_threshold) 
      : 80;

    if (alertThresholdValue < 0 || alertThresholdValue > 100) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Alert threshold harus antara 0 dan 100',
      });
      setBudgetSubmitting(false);
      return;
    }

    // For edit mode, use single month
    if (editingBudget) {
      try {
        const response = await fetch(`/api/budgets/${editingBudget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            category_id: budgetForm.category_id,
            year: budgetForm.year,
            month: budgetForm.month,
            amount: amountValue,
            currency_id: budgetForm.currency_id,
            alert_threshold: alertThresholdValue,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          Swal.fire({
            icon: 'error',
            title: t.common.error,
            text: data.error || t.common.error,
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: t.common.success,
          text: data.message || t.common.success,
          timer: 2000,
          showConfirmButton: false,
        });

        setShowBudgetForm(false);
        setEditingBudget(null);
        setSelectedMonths([]);
        setBudgetForm({
          category_id: '',
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          amount: '',
          currency_id: '',
          alert_threshold: '80',
        });
        setBudgetSubmitting(false);
        loadData();
      } catch (err) {
        console.error('Error updating budget:', err);
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: t.common.error,
        });
        setBudgetSubmitting(false);
      }
      return;
    }

    // For create mode, check if multiple months selected
    const monthsToCreate = selectedMonths.length > 0 ? selectedMonths : [];

    if (monthsToCreate.length === 0) {
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
      setBudgetSubmitting(false);
      return;
    }

    try {
      // Create budget for each selected month
      const promises = monthsToCreate.map((month) =>
        fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            category_id: budgetForm.category_id,
            year: budgetForm.year,
            month: month,
            amount: amountValue,
            currency_id: budgetForm.currency_id,
            alert_threshold: alertThresholdValue,
          }),
        })
      );

      const results = await Promise.allSettled(promises);
      const responses = await Promise.all(
        results.map((result) =>
          result.status === 'fulfilled' ? result.value.json() : Promise.resolve({ error: 'Failed' })
        )
      );

      const errors = responses.filter((r) => r.error);
      const successes = responses.filter((r) => !r.error);

      if (errors.length > 0 && successes.length === 0) {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: errors[0]?.error || t.common.error,
        });
        setBudgetSubmitting(false);
        return;
      }

      if (errors.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: t.common.warning,
          text: `${successes.length} ${t.budget.title} ${t.common.success}, ${errors.length} ${t.common.error}.`,
          timer: 3000,
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: t.common.success,
          text: `${successes.length} ${t.budget.title} ${t.common.success}`,
          timer: 2000,
          showConfirmButton: false,
        });
      }

      setShowBudgetForm(false);
      setEditingBudget(null);
      setSelectedMonths([]);
      setBudgetForm({
        category_id: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        amount: '',
        currency_id: '',
        alert_threshold: '80',
      });
      setBudgetSubmitting(false);
      loadData();
    } catch (err) {
      console.error('Error creating budgets:', err);
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
      setBudgetSubmitting(false);
    }
  };

  const openEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setSelectedMonths([]); // Clear selected months for edit mode
    const locale = language === 'en' ? 'en-US' : 'id-ID';
    setBudgetForm({
      category_id: budget.category_id,
      year: budget.year,
      month: budget.month,
      amount: formatCurrencyInput(budget.amount.toString(), locale),
      currency_id: budget.currency_id,
      alert_threshold: budget.alert_threshold.toString(),
    });
    setShowBudgetForm(true);
  };

  const handleDeleteBudget = async (id: string) => {
    const result = await Swal.fire({
      title: t.budget.confirmDelete,
      text: t.budget.confirmDeleteBudget,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: t.common.delete,
      cancelButtonText: t.common.cancel,
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/budgets/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          Swal.fire({
            icon: 'error',
            title: t.common.error,
            text: data.error || t.common.error,
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: t.common.success,
          text: data.message || t.common.success,
          timer: 2000,
          showConfirmButton: false,
        });

        loadData();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: t.common.error,
        });
      }
    }
  };

  // Account functions
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountSubmitting) return;
    
    setError('');
    setSuccess('');
    setAccountSubmitting(true);

    try {
      const url = editingAccount
        ? `/api/accounts/${editingAccount.id}`
        : '/api/accounts';
      const method = editingAccount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(accountForm),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: data.error || t.common.error,
        });
        setError(data.error || t.common.error);
        setAccountSubmitting(false);
        return;
      }

      Swal.fire({
        icon: 'success',
        title: t.common.success,
        text: data.message || t.common.success,
        timer: 2000,
        showConfirmButton: false,
      });
      setShowAccountForm(false);
      setEditingAccount(null);
      setAccountForm({
        name: '',
        type: 'cash',
        account_number: '',
        currency_id: '',
        description: '',
        is_default: false,
      });
      setAccountSubmitting(false);
      loadData();
    } catch (err) {
      console.error('Error submitting account:', err);
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
      setError(t.common.error);
      setAccountSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    const result = await Swal.fire({
      title: t.settings.confirmDelete,
      text: t.settings.confirmDeleteAccount,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t.common.yes,
      cancelButtonText: t.common.cancel,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: data.error || t.common.error,
        });
        setError(data.error || t.common.error);
        return;
      }

      Swal.fire({
        icon: 'success',
        title: t.common.success,
        text: data.message || t.common.success,
        timer: 2000,
        showConfirmButton: false,
      });
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.common.error,
      });
      setError(t.common.error);
    }
  };

  const openEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccountForm({
      name: account.name,
      type: account.type,
      account_number: account.account_number || '',
      currency_id: account.currency_id || '',
      description: account.description || '',
      is_default: account.is_default,
    });
    setShowAccountForm(true);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Decorative background elements - soft and subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2563EB]/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#10B981]/3 rounded-full blur-3xl"></div>
      </div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t.settings.title}</h1>
          <p className="mt-2 text-gray-600">{t.settings.subtitle}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-[#EF4444] px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-[#10B981] px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('currencies')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'currencies'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.settings.currencies}
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.settings.categories}
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'budgets'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.budget.title}
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'accounts'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.settings.accounts}
            </button>
          </nav>
        </div>

        {/* Currencies Tab */}
        {activeTab === 'currencies' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">{t.settings.currencies}</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateExchangeRates}
                  disabled={updatingRates || currencies.length === 0}
                  className="px-4 py-2 bg-[#10B981] text-white rounded-md hover:bg-[#059669] transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingRates ? t.settings.updatingRates : t.settings.updateRates}
                </button>
                <button
                  onClick={() => {
                    setShowCurrencyForm(true);
                    setEditingCurrency(null);
                    setCurrencyForm({
                      code: '',
                      name: '',
                      symbol: '',
                      is_default: false,
                      exchange_rate: 1.0,
                    });
                  }}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1E40AF] transition font-medium text-sm"
                >
                  + {t.settings.addCurrency}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-center text-gray-500">{t.common.loading}</div>
            ) : (
              <div className="p-6">
                {/* Default Currency Info */}
                {currencies.length > 0 && (
                  <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-blue-800 mb-1">{t.settings.defaultCurrencyInfo}</p>
                        <p className="text-sm text-blue-700">{t.settings.defaultCurrencyDescription}</p>
                      </div>
                    </div>
                  </div>
                )}
                {currencies.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {t.settings.noCurrency}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.settings.code}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.settings.name}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.settings.symbol}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.settings.exchangeRate}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.settings.default}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.settings.actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currencies.map((currency) => (
                          <tr key={currency.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {currency.code}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {currency.name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {currency.symbol || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {currency.is_default ? (
                                <span className="font-semibold">1.0 ({t.settings.base})</span>
                              ) : (
                                <span>{currency.exchange_rate.toFixed(6)}</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {currency.is_default ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-[#059669]">
                                  {t.settings.default}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => openEditCurrency(currency)}
                                className="text-[#2563EB] hover:text-[#1E40AF] mr-4"
                              >
                                {t.common.edit}
                              </button>
                              <button
                                onClick={() => handleDeleteCurrency(currency.id)}
                                className="text-[#EF4444] hover:text-[#DC2626]"
                              >
                                {t.settings.deleteCurrency}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">{t.settings.categories}</h2>
              <button
                onClick={() => {
                  setShowCategoryForm(true);
                  setEditingCategory(null);
                  setCategoryForm({
                    type: 'income',
                    name: '',
                    icon: '',
                    color: '#3B82F6',
                    is_default: false,
                  });
                }}
                className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1E40AF] transition font-medium text-sm"
              >
                + {t.settings.addCategory}
              </button>
            </div>

            {loading ? (
              <div className="p-6 text-center text-gray-500">{t.common.loading}</div>
            ) : (
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={() => {
                        const incomeCategories = categories.filter((c) => c.type === 'income');
                        const outcomeCategories = categories.filter((c) => c.type === 'outcome');
                        // You can add filter logic here
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      {t.transactions.income} ({categories.filter((c) => c.type === 'income').length})
                    </button>
                    <button
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      {t.transactions.outcome} ({categories.filter((c) => c.type === 'outcome').length})
                    </button>
                  </div>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {t.settings.noCategory}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded ${
                                  category.type === 'income'
                                    ? 'bg-green-100 text-[#059669]'
                                    : 'bg-red-100 text-[#DC2626]'
                                }`}
                              >
                                {category.type === 'income' ? 'Income' : 'Outcome'}
                              </span>
                              {category.is_default && (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-[#2563EB]">
                                  Default
                                </span>
                              )}
                            </div>
                            <h3 className="font-medium text-gray-900">{category.name}</h3>
                            {category.color && (
                              <div
                                className="mt-2 w-8 h-8 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditCategory(category)}
                              className="text-[#2563EB] hover:text-[#1E40AF] text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-[#EF4444] hover:text-[#DC2626] text-sm"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Currency Form Modal */}
        {showCurrencyForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
              onClick={() => {
                setShowCurrencyForm(false);
                setEditingCurrency(null);
              }}
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingCurrency ? t.settings.editCurrency : t.settings.addCurrency}
                  </h3>
                  <form onSubmit={handleCurrencySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {t.settings.code} <span className="text-[#EF4444]">*</span>
                      </label>
                      {editingCurrency ? (
                        <input
                          type="text"
                          value={currencyForm.code}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                      ) : (
                        <select
                          value={currencyForm.code}
                          onChange={(e) => handleCurrencyCodeChange(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                        >
                          <option value="">{t.common.filter} {t.settings.code}</option>
                          {WORLDWIDE_CURRENCIES.map((currency) => {
                            // Filter out currencies that already exist
                            const exists = currencies.some((c) => c.code === currency.code);
                            return (
                              <option
                                key={currency.code}
                                value={currency.code}
                                disabled={exists}
                              >
                                {currency.code} - {currency.name} {exists && `(${t.common.yes})`}
                              </option>
                            );
                          })}
                        </select>
                      )}
                      {editingCurrency && (
                        <p className="mt-1 text-xs text-gray-500">
                          {t.settings.codeCannotChange}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {t.settings.name} <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="text"
                        value={currencyForm.name}
                        onChange={(e) =>
                          setCurrencyForm({ ...currencyForm, name: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                        placeholder={t.settings.name}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {t.settings.symbol}
                      </label>
                      <input
                        type="text"
                        value={currencyForm.symbol}
                        onChange={(e) =>
                          setCurrencyForm({ ...currencyForm, symbol: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                        placeholder="$"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {t.settings.exchangeRate}
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={currencyForm.exchange_rate}
                        onChange={(e) =>
                          setCurrencyForm({
                            ...currencyForm,
                            exchange_rate: parseFloat(e.target.value) || 1.0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                      />
                      {!currencyForm.is_default && (
                        <p className="mt-1 text-xs text-gray-500">
                          {t.settings.defaultCurrencyDescription}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={currencyForm.is_default}
                        onChange={(e) =>
                          setCurrencyForm({ ...currencyForm, is_default: e.target.checked })
                        }
                        className="h-4 w-4 text-[#2563EB] focus:ring-[#2563EB] border-gray-300 rounded"
                      />
                      <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                        {t.settings.setAsDefault}
                      </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCurrencyForm(false);
                          setEditingCurrency(null);
                        }}
                        disabled={currencySubmitting}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="submit"
                        disabled={currencySubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {currencySubmitting && (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {currencySubmitting ? t.common.loading : t.common.save}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Form Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
              onClick={() => {
                setShowCategoryForm(false);
                setEditingCategory(null);
              }}
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingCategory ? 'Edit Category' : 'Tambah Category'}
                  </h3>
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Type <span className="text-[#EF4444]">*</span>
                      </label>
                      <select
                        value={categoryForm.type}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            type: e.target.value as 'income' | 'outcome',
                          })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                      >
                        <option value="income">Income</option>
                        <option value="outcome">Outcome</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Name <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, name: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                        placeholder="Category name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Icon (Emoji)
                      </label>
                      <input
                        type="text"
                        value={categoryForm.icon}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, icon: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                        placeholder="💰"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Color
                      </label>
                      <input
                        type="color"
                        value={categoryForm.color}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, color: e.target.value })
                        }
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_default_cat"
                        checked={categoryForm.is_default}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, is_default: e.target.checked })
                        }
                        className="h-4 w-4 text-[#2563EB] focus:ring-[#2563EB] border-gray-300 rounded"
                      />
                      <label htmlFor="is_default_cat" className="ml-2 block text-sm text-gray-900">
                        {t.settings.setAsDefaultCategory}
                      </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryForm(false);
                          setEditingCategory(null);
                        }}
                        disabled={categorySubmitting}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="submit"
                        disabled={categorySubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {categorySubmitting && (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {categorySubmitting ? t.common.loading : t.common.save}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">{t.budget.title}</h2>
              <button
                onClick={() => {
                  setEditingBudget(null);
                  const currentMonth = new Date().getMonth() + 1;
                  setSelectedMonths([currentMonth]); // Default to current month
                  const defaultCurrency = currencies.find((c) => c.is_default);
                  setBudgetForm({
                    category_id: '',
                    year: new Date().getFullYear(),
                    month: currentMonth,
                    amount: '',
                    currency_id: defaultCurrency?.id || '',
                    alert_threshold: '80',
                  });
                  setShowBudgetForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                {t.budget.addBudget}
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">{t.common.loading}</div>
            ) : budgets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t.budget.noBudgets}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.budget.category}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.budget.year}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.budget.month}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t.budget.budget}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t.budget.spent}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t.budget.remaining}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t.budget.progress}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.settings.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {budgets.map((budget) => (
                      <tr key={budget.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{budget.category?.icon || ''}</span>
                            <span className="text-sm text-gray-900">{budget.category?.name || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{budget.year}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(2000, budget.month - 1).toLocaleString('default', { month: 'long' })}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: budget.currency?.code || 'IDR',
                            minimumFractionDigits: 0,
                          }).format(budget.amount)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                          <span className={budget.isExceeded ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: budget.currency?.code || 'IDR',
                              minimumFractionDigits: 0,
                            }).format(budget.spent || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                          <span className={budget.remaining && budget.remaining < 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: budget.currency?.code || 'IDR',
                              minimumFractionDigits: 0,
                            }).format(budget.remaining || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                budget.isExceeded
                                  ? 'bg-red-600'
                                  : budget.isNearLimit
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(budget.percentage || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 mt-1 block">
                            {budget.percentage?.toFixed(1)}%
                            {budget.isExceeded && ` (${t.budget.exceeded})`}
                            {budget.isNearLimit && !budget.isExceeded && ` (${t.budget.nearLimit})`}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditBudget(budget)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {t.common.edit}
                            </button>
                            <button
                              onClick={() => handleDeleteBudget(budget.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              {t.common.delete}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Budget Form Modal */}
        {showBudgetForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
              onClick={() => {
                setShowBudgetForm(false);
                setEditingBudget(null);
                setSelectedMonths([]);
              }}
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingBudget ? t.budget.editBudget : t.budget.addBudget}
                  </h3>
                </div>
                <form onSubmit={handleBudgetSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {t.budget.category} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={budgetForm.category_id}
                      onChange={(e) => setBudgetForm({ ...budgetForm, category_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                    >
                      <option value="">{t.budget.selectCategory}</option>
                      {categories
                        .filter((cat) => cat.type === 'outcome')
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {t.budget.year} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={budgetForm.year}
                      onChange={(e) => setBudgetForm({ ...budgetForm, year: parseInt(e.target.value) })}
                      required
                      min="2020"
                      max="2100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                    />
                  </div>
                  {editingBudget ? (
                    // Edit mode: single month selector
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {t.budget.month} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={budgetForm.month}
                        onChange={(e) => setBudgetForm({ ...budgetForm, month: parseInt(e.target.value) })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m}>
                            {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    // Create mode: multiple months selector
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {t.budget.month} <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-2">{t.settings.selectOneOrMoreMonths}</span>
                      </label>
                      <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                        <div className="flex items-center justify-between mb-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedMonths.length === 12) {
                                setSelectedMonths([]);
                              } else {
                                setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
                              }
                            }}
                            className="text-xs text-[#2563EB] hover:text-[#1E40AF]"
                          >
                            {selectedMonths.length === 12 ? t.settings.removeAll : t.settings.selectAll}
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                            const isSelected = selectedMonths.includes(m);
                            return (
                              <label
                                key={m}
                                className={`flex items-center p-2 rounded cursor-pointer transition ${
                                  isSelected
                                    ? 'bg-[#2563EB] text-white'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedMonths([...selectedMonths, m].sort((a, b) => a - b));
                                    } else {
                                      setSelectedMonths(selectedMonths.filter((month) => month !== m));
                                    }
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-sm">
                                  {new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      {selectedMonths.length > 0 ? (
                        <p className="mt-2 text-xs text-gray-600">
                          {selectedMonths.length} bulan dipilih: {selectedMonths
                            .map((m) => new Date(2000, m - 1).toLocaleString('default', { month: 'short' }))
                            .join(', ')}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-red-500">
                          {t.settings.selectAtLeastOneMonth}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {t.budget.amount} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={budgetForm.amount}
                      onChange={(e) => {
                        const locale = language === 'en' ? 'en-US' : 'id-ID';
                        const formatted = formatCurrencyInput(e.target.value, locale);
                        setBudgetForm({ ...budgetForm, amount: formatted });
                      }}
                      required
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {t.budget.currency} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={budgetForm.currency_id}
                      onChange={(e) => setBudgetForm({ ...budgetForm, currency_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                    >
                      <option value="">{t.budget.selectCategory}</option>
                      {currencies.map((curr) => (
                        <option key={curr.id} value={curr.id}>
                          {curr.code} - {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {t.budget.alertThreshold}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={budgetForm.alert_threshold}
                      onChange={(e) => {
                        // Allow only numbers
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        // Limit to 0-100
                        const numValue = value === '' ? '' : Math.min(100, Math.max(0, parseInt(value) || 0)).toString();
                        setBudgetForm({ ...budgetForm, alert_threshold: numValue });
                      }}
                      placeholder="80"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                    />
                    <p className="mt-1 text-xs text-gray-500">{t.budget.alertThresholdDesc}</p>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBudgetForm(false);
                        setEditingBudget(null);
                      }}
                      disabled={budgetSubmitting}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={budgetSubmitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {budgetSubmitting && (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {budgetSubmitting ? t.common.loading : t.common.save}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">{t.settings.accounts}</h2>
              <button
                onClick={() => {
                  setShowAccountForm(true);
                  setEditingAccount(null);
                  const defaultCurrency = currencies.find((c) => c.is_default);
                  setAccountForm({
                    name: '',
                    type: 'cash',
                    account_number: '',
                    currency_id: defaultCurrency?.id || '',
                    description: '',
                    is_default: false,
                  });
                }}
                className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1E40AF] transition font-medium text-sm"
              >
                + {t.settings.addAccount}
              </button>
            </div>

            {loading ? (
              <div className="p-6 text-center text-gray-500">{t.common.loading}</div>
            ) : (
              <div className="p-6">
                {accounts.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {t.settings.noAccount}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.settings.name}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.settings.accountType}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.settings.accountNumber}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.settings.default}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.settings.actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accounts.map((account) => (
                          <tr key={account.id}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{account.name}</div>
                              {account.description && (
                                <div className="text-sm text-gray-500">{account.description}</div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {account.type === 'cash' && t.settings.accountTypeCash}
                              {account.type === 'bank' && t.settings.accountTypeBank}
                              {account.type === 'credit_card' && t.settings.accountTypeCreditCard}
                              {account.type === 'investment' && t.settings.accountTypeInvestment}
                              {account.type === 'other' && t.settings.accountTypeOther}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {account.account_number || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {account.is_default ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-[#059669]">
                                  {t.settings.default}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => openEditAccount(account)}
                                className="text-[#2563EB] hover:text-[#1E40AF] mr-4"
                              >
                                {t.common.edit}
                              </button>
                              <button
                                onClick={() => handleDeleteAccount(account.id)}
                                className="text-[#EF4444] hover:text-[#DC2626]"
                              >
                                {t.settings.deleteAccount}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Account Form Modal */}
        {showAccountForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
              onClick={() => {
                setShowAccountForm(false);
                setEditingAccount(null);
              }}
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingAccount ? t.settings.editAccount : t.settings.addAccount}
                  </h3>
                  <form onSubmit={handleAccountSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {t.settings.name} <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="text"
                        value={accountForm.name}
                        onChange={(e) =>
                          setAccountForm({ ...accountForm, name: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                        placeholder={t.settings.name}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {t.settings.accountType} <span className="text-[#EF4444]">*</span>
                      </label>
                      <select
                        value={accountForm.type}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            type: e.target.value as AccountType,
                          })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                      >
                        <option value="cash">{t.settings.accountTypeCash}</option>
                        <option value="bank">{t.settings.accountTypeBank}</option>
                        <option value="credit_card">{t.settings.accountTypeCreditCard}</option>
                        <option value="investment">{t.settings.accountTypeInvestment}</option>
                        <option value="other">{t.settings.accountTypeOther}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {t.settings.accountNumber} <span className="text-gray-500 text-xs">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        value={accountForm.account_number}
                        onChange={(e) =>
                          setAccountForm({ ...accountForm, account_number: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                        placeholder={t.settings.accountNumber}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {t.budget.currency}
                      </label>
                      <select
                        value={accountForm.currency_id}
                        onChange={(e) =>
                          setAccountForm({ ...accountForm, currency_id: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                      >
                        <option value="">{t.common.filter} {t.budget.currency}</option>
                        {currencies.map((curr) => (
                          <option key={curr.id} value={curr.id}>
                            {curr.code} - {curr.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {t.settings.accountDescription}
                      </label>
                      <textarea
                        value={accountForm.description}
                        onChange={(e) =>
                          setAccountForm({ ...accountForm, description: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 resize-none"
                        placeholder={t.settings.accountDescription}
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_default_account"
                        checked={accountForm.is_default}
                        onChange={(e) =>
                          setAccountForm({ ...accountForm, is_default: e.target.checked })
                        }
                        className="h-4 w-4 text-[#2563EB] focus:ring-[#2563EB] border-gray-300 rounded"
                      />
                      <label htmlFor="is_default_account" className="ml-2 block text-sm text-gray-900">
                        {t.settings.setAsDefaultAccount}
                      </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountForm(false);
                          setEditingAccount(null);
                        }}
                        disabled={accountSubmitting}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="submit"
                        disabled={accountSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {accountSubmitting && (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {accountSubmitting ? t.common.loading : t.common.save}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

