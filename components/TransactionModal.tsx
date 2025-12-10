'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { TransactionType } from '@/types/transaction';
import { supabase } from '@/lib/supabase/client';
import { Currency } from '@/types/currency';
import { Category } from '@/types/category';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: TransactionType;
  onSuccess?: () => void;
}

export default function TransactionModal({ isOpen, onClose, type, onSuccess }: TransactionModalProps) {
  const [formData, setFormData] = useState({
    type: type || ('income' as TransactionType),
    amount: '',
    currency_id: '',
    description: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (type && isOpen) {
      setFormData(prev => ({ ...prev, type, category_id: '' }));
      loadCategories();
    }
  }, [type]);

  useEffect(() => {
    if (isOpen) {
      loadCurrencies();
      loadCategories();
      // Reset form when modal opens
      const currentType = type || formData.type;
      setFormData({
        type: currentType,
        amount: '',
        currency_id: '',
        description: '',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
      });
      setError('');
    }
  }, [isOpen, type]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get session from Supabase client
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Anda harus login terlebih dahulu',
        });
        setError('Anda harus login terlebih dahulu');
        setLoading(false);
        return;
      }

      if (!formData.category_id) {
        Swal.fire({
          icon: 'warning',
          title: 'Peringatan!',
          text: 'Kategori wajib diisi',
        });
        setError('Kategori wajib diisi');
        return;
      }

      if (!formData.currency_id) {
        Swal.fire({
          icon: 'warning',
          title: 'Peringatan!',
          text: 'Currency wajib diisi',
        });
        setError('Currency wajib diisi');
        return;
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          type: formData.type,
          amount: parseFloat(formData.amount),
          currency_id: formData.currency_id,
          description: formData.description || undefined,
          category_id: formData.category_id,
          date: formData.date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: data.error || 'Gagal menambahkan transaksi',
        });
        setError(data.error || 'Gagal menambahkan transaksi');
        return;
      }

      // Success
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Transaksi berhasil ditambahkan',
        timer: 2000,
        showConfirmButton: false,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Terjadi kesalahan saat menambahkan transaksi',
      });
      setError('Terjadi kesalahan saat menambahkan transaksi');
    } finally {
      setLoading(false);
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

  // Reload categories when type changes
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [formData.type, isOpen]);

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
              {formData.type === 'income' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}
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
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Type Toggle */}
              {!type && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Tipe Transaksi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'income', category_id: '' })}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        formData.type === 'income'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Pemasukan
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'outcome', category_id: '' })}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        formData.type === 'outcome'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Pengeluaran
                    </button>
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-900 mb-1">
                  Kategori <span className="text-red-500">*</span>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                    Jumlah <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-900 mb-1">
                    Mata Uang
                  </label>
                  {loadingData ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                      Loading...
                    </div>
                  ) : (
                    <select
                      id="currency"
                      value={formData.currency_id}
                      onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="">Pilih currency</option>
                      {currencies.map((curr) => (
                        <option key={curr.id} value={curr.id}>
                          {curr.code} {curr.symbol && `(${curr.symbol})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-900 mb-1">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                  placeholder="Tambahkan catatan atau deskripsi..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
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
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


