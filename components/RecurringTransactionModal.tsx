'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { TransactionType } from '@/types/transaction';
import { RecurringFrequency } from '@/types/recurring-transaction';
import { supabase } from '@/lib/supabase/client';
import { Currency } from '@/types/currency';
import { Category } from '@/types/category';
import { useI18n } from '@/lib/i18n/context';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils/currency';

interface RecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringTransactionId?: string;
  onSuccess?: () => void;
}

export default function RecurringTransactionModal({ 
  isOpen, 
  onClose, 
  recurringTransactionId,
  onSuccess 
}: RecurringTransactionModalProps) {
  const { t, language } = useI18n();
  const [formData, setFormData] = useState({
    type: 'income' as TransactionType,
    amount: '',
    currency_id: '',
    description: '',
    category_id: '',
    frequency: 'monthly' as RecurringFrequency,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrencies();
      loadCategories();
      
      if (recurringTransactionId) {
        loadRecurringTransaction(recurringTransactionId);
      } else {
        resetForm();
      }
    }
  }, [isOpen, recurringTransactionId]);

  const resetForm = () => {
    setFormData({
      type: 'income',
      amount: '',
      currency_id: '',
      description: '',
      category_id: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    });
    setError('');
  };

  const loadRecurringTransaction = async (id: string) => {
    setLoadingData(true);
    try {
      const response = await fetch(`/api/recurring-transactions/${id}`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (response.ok && data.recurringTransaction) {
        const rt = data.recurringTransaction;
        const locale = language === 'en' ? 'en-US' : 'id-ID';
        setFormData({
          type: rt.type,
          amount: formatCurrencyInput(rt.amount.toString(), locale),
          currency_id: rt.currency_id || '',
          description: rt.description || '',
          category_id: rt.category_id || '',
          frequency: rt.frequency,
          start_date: rt.start_date.split('T')[0],
          end_date: rt.end_date ? rt.end_date.split('T')[0] : '',
        });
      }
    } catch (err) {
      console.error('Failed to load recurring transaction:', err);
      setError('Gagal memuat data recurring transaction');
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
        const defaultCurrency = data.currencies?.find((c: Currency) => c.is_default);
        if (defaultCurrency && !formData.currency_id) {
          setFormData(prev => ({ ...prev, currency_id: defaultCurrency.id }));
        }
      }
    } catch (err) {
      console.error('Failed to load currencies:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`/api/categories?type=${formData.type}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [formData.type, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.category_id) {
        Swal.fire({
          icon: 'warning',
          title: 'Peringatan!',
          text: 'Kategori wajib diisi',
        });
        setError('Kategori wajib diisi');
        setLoading(false);
        return;
      }

      if (!formData.currency_id) {
        Swal.fire({
          icon: 'warning',
          title: 'Peringatan!',
          text: 'Currency wajib diisi',
        });
        setError('Currency wajib diisi');
        setLoading(false);
        return;
      }

      const url = recurringTransactionId 
        ? `/api/recurring-transactions/${recurringTransactionId}`
        : '/api/recurring-transactions';
      const method = recurringTransactionId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: formData.type,
          amount: parseCurrencyInput(formData.amount, language === 'en' ? 'en-US' : 'id-ID'),
          currency_id: formData.currency_id,
          description: formData.description || undefined,
          category_id: formData.category_id,
          frequency: formData.frequency,
          start_date: formData.start_date,
          end_date: formData.end_date || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: data.error || (recurringTransactionId ? 'Gagal mengupdate recurring transaction' : 'Gagal menambahkan recurring transaction'),
        });
        setError(data.error || (recurringTransactionId ? 'Gagal mengupdate recurring transaction' : 'Gagal menambahkan recurring transaction'));
        setLoading(false);
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: recurringTransactionId ? 'Recurring transaction berhasil diupdate' : 'Recurring transaction berhasil ditambahkan',
        timer: 2000,
        showConfirmButton: false,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Terjadi kesalahan saat menyimpan recurring transaction',
      });
      setError('Terjadi kesalahan saat menyimpan recurring transaction');
    } finally {
      setLoading(false);
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
              {recurringTransactionId 
                ? 'Edit Recurring Transaction'
                : 'Tambah Recurring Transaction'
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
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tipe Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setFormData({ ...formData, type: 'income', category_id: '' });
                      // Load categories for income type
                      const response = await fetch('/api/categories?type=income', {
                        credentials: 'include',
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setCategories(data.categories || []);
                        const defaultCategory = data.categories?.find((c: Category) => c.is_default);
                        if (defaultCategory) {
                          setFormData(prev => ({ ...prev, category_id: defaultCategory.id }));
                        }
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      formData.type === 'income'
                        ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setFormData({ ...formData, type: 'outcome', category_id: '' });
                      // Load categories for outcome type
                      const response = await fetch('/api/categories?type=outcome', {
                        credentials: 'include',
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setCategories(data.categories || []);
                        const defaultCategory = data.categories?.find((c: Category) => c.is_default);
                        if (defaultCategory) {
                          setFormData(prev => ({ ...prev, category_id: defaultCategory.id }));
                        }
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      formData.type === 'outcome'
                        ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pengeluaran
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-900 mb-1">
                  Kategori <span className="text-[#EF4444]">*</span>
                </label>
                {loadingData ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    Loading...
                  </div>
                ) : (
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon && <span>{cat.icon} </span>}
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Amount and Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-900 mb-1">
                    Jumlah <span className="text-[#EF4444]">*</span>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-900 mb-1">
                    Currency <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    id="currency"
                    value={formData.currency_id}
                    onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                  >
                    <option value="">Pilih</option>
                    {currencies.map((curr) => (
                      <option key={curr.id} value={curr.id}>
                        {curr.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-900 mb-1">
                  Frekuensi <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  id="frequency"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurringFrequency })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                >
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-900 mb-1">
                  Tanggal Mulai <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                />
              </div>

              {/* End Date (Optional) */}
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-900 mb-1">
                  Tanggal Berakhir (Opsional)
                </label>
                <input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  min={formData.start_date}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 resize-none"
                  placeholder="Deskripsi transaksi..."
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
                Batal
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
                {loading ? 'Menyimpan...' : recurringTransactionId ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

