'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { TransactionType } from '@/types/transaction';
import { supabase } from '@/lib/supabase/client';
import { Currency } from '@/types/currency';
import { Category } from '@/types/category';
import { Account } from '@/types/account';
import { useI18n } from '@/lib/i18n/context';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils/currency';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: TransactionType;
  transactionId?: string; // For edit mode
  onSuccess?: () => void;
}

export default function TransactionModal({ isOpen, onClose, type, transactionId, onSuccess }: TransactionModalProps) {
  const { t, language } = useI18n();
  const [formData, setFormData] = useState({
    type: type || ('income' as TransactionType),
    amount: '',
    currency_id: '',
    description: '',
    category_id: '',
    account_id: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrencies();
      loadAccounts();
      
      if (transactionId) {
        // Edit mode: load transaction data
        loadTransaction(transactionId);
      } else {
        // Add mode: reset form
        const currentType = type || formData.type;
        setFormData({
          type: currentType,
          amount: '',
          currency_id: '',
          description: '',
          category_id: '',
          account_id: '',
          date: new Date().toISOString().split('T')[0],
        });
        setError('');
        // Load categories for the current type
        loadCategoriesForType(currentType);
      }
    }
  }, [isOpen, type, transactionId]);

  // Note: Categories are loaded directly in onClick handlers and when modal opens
  // This useEffect is kept minimal to avoid conflicts

  const loadTransaction = async (id: string) => {
    setLoadingData(true);
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (response.ok && data.transaction) {
        const tx = data.transaction;
        const locale = language === 'en' ? 'en-US' : 'id-ID';
        setFormData({
          type: tx.type,
          amount: formatCurrencyInput(tx.amount.toString(), locale),
          currency_id: tx.currency_id || '',
          description: tx.description || '',
          category_id: tx.category_id || '',
          account_id: tx.account_id || '',
          date: tx.date.split('T')[0],
        });
        // Load categories for the transaction type
        loadCategoriesForType(tx.type);
      }
    } catch (err) {
      console.error('Failed to load transaction:', err);
      setError('Gagal memuat data transaksi');
    } finally {
      setLoadingData(false);
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await fetch('/api/currencies', {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setCurrencies(data.currencies || []);
        // Set default currency if available
        const defaultCurrency = data.currencies?.find((c: Currency) => c.is_default);
        if (defaultCurrency) {
          setFormData(prev => ({ ...prev, currency_id: defaultCurrency.id }));
        }
      }
    } catch (err) {
      console.error('Failed to load currencies:', err);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/accounts', {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setAccounts(data.accounts || []);
        // Set default account if available
        const defaultAccount = data.accounts?.find((a: Account) => a.is_default);
        if (defaultAccount) {
          setFormData(prev => ({ ...prev, account_id: defaultAccount.id }));
        }
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.category_id) {
        Swal.fire({
          icon: 'warning',
          title: t.common.warning,
          text: t.transactionModal.categoryRequired,
        });
        setError(t.transactionModal.categoryRequired);
        setLoading(false);
        return;
      }

      if (!formData.currency_id) {
        Swal.fire({
          icon: 'warning',
          title: t.common.warning,
          text: t.transactionModal.currencyRequired,
        });
        setError(t.transactionModal.currencyRequired);
        setLoading(false);
        return;
      }

      const url = transactionId 
        ? `/api/transactions/${transactionId}`
        : '/api/transactions';
      const method = transactionId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          type: formData.type,
          amount: parseCurrencyInput(formData.amount, language === 'en' ? 'en-US' : 'id-ID'),
          currency_id: formData.currency_id || undefined,
          description: formData.description || undefined,
          category_id: formData.category_id,
          account_id: formData.account_id || undefined,
          date: formData.date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: data.error || (transactionId ? t.transactionModal.error : t.transactionModal.error),
        });
        setError(data.error || (transactionId ? t.transactionModal.error : t.transactionModal.error));
        return;
      }

      // Success
      Swal.fire({
        icon: 'success',
        title: t.common.success,
        text: transactionId ? t.transactionModal.success : t.transactionModal.success,
        timer: 2000,
        showConfirmButton: false,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: t.transactionModal.error,
      });
      setError(t.transactionModal.error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesForType = async (transactionType: TransactionType) => {
    try {
      const response = await fetch(`/api/categories?type=${transactionType}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
        // Set default category if available
        const defaultCategory = data.categories?.find((c: Category) => c.is_default);
        if (defaultCategory) {
          setFormData(prev => ({ ...prev, category_id: defaultCategory.id }));
        } else {
          setFormData(prev => ({ ...prev, category_id: '' }));
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {transactionId 
                ? (formData.type === 'income' ? t.transactionModal.addIncome : t.transactionModal.addOutcome)
                : (formData.type === 'income' ? t.transactionModal.addIncome : t.transactionModal.addOutcome)
              }
            </h2>
            <button
              onClick={onClose}
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
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-[#EF4444] px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Type Toggle */}
              {!type && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t.transactionModal.transactionType}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, type: 'income', category_id: '' }));
                        loadCategoriesForType('income');
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        formData.type === 'income'
                          ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.transactionModal.income}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, type: 'outcome', category_id: '' }));
                        loadCategoriesForType('outcome');
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        formData.type === 'outcome'
                          ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.transactionModal.outcome}
                    </button>
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-900 mb-1">
                  {t.transactionModal.category} <span className="text-[#EF4444]">*</span>
                </label>
                {loadingData ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    {t.common.loading}
                  </div>
                ) : (
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                  >
                    <option value="">{t.transactions.selectCategory}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Amount and Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-900 mb-1">
                    {t.transactionModal.amount} <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={(e) => {
                      const locale = language === 'en' ? 'en-US' : 'id-ID';
                      const formatted = formatCurrencyInput(e.target.value, locale);
                      setFormData({ ...formData, amount: formatted });
                    }}
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-900 mb-1">
                    {t.transactionModal.currency} <span className="text-[#EF4444]">*</span>
                  </label>
                  {loadingData ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                      {t.common.loading}
                    </div>
                  ) : (
                    <select
                      id="currency"
                      value={formData.currency_id}
                      onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                    >
                      <option value="">{t.transactions.selectCurrency}</option>
                      {currencies.map((curr) => (
                        <option key={curr.id} value={curr.id}>
                          {curr.code} {curr.symbol && `(${curr.symbol})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Account */}
              <div>
                <label htmlFor="account" className="block text-sm font-medium text-gray-900 mb-1">
                  {t.settings.accounts} <span className="text-gray-500 text-xs">(Opsional)</span>
                </label>
                {loadingData ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    {t.common.loading}
                  </div>
                ) : (
                  <select
                    id="account"
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                  >
                    <option value="">Pilih {t.settings.accounts}</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} {acc.currency && `(${acc.currency.code})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-900 mb-1">
                    {t.transactionModal.date} <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1">
                  {t.transactionModal.descriptionOptional}
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder={t.transactionModal.descriptionPlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                {t.transactionModal.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.type === 'income'
                    ? 'bg-[#10B981] hover:bg-[#059669]'
                    : 'bg-[#EF4444] hover:bg-[#DC2626]'
                }`}
              >
                {loading ? t.transactionModal.saving : transactionId ? t.common.save : t.transactionModal.save}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


