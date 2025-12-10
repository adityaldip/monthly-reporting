'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Navbar from '@/components/Navbar';
import { Currency, CurrencyCreate } from '@/types/currency';
import { Category, CategoryCreate } from '@/types/category';
import { WORLDWIDE_CURRENCIES, getCurrencyByCode } from '@/lib/currencies';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'currencies' | 'categories'>('currencies');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRates, setUpdatingRates] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          const errorMsg = data.error || 'Gagal memuat currencies';
          setError(errorMsg);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: errorMsg,
          });
          return;
        }
        setCurrencies(data.currencies || []);
      } else {
        const response = await fetch('/api/categories', {
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          const errorMsg = data.error || 'Gagal memuat categories';
          setError(errorMsg);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: errorMsg,
          });
          return;
        }
        setCategories(data.categories || []);
      }
    } catch (err) {
      const errorMsg = 'Terjadi kesalahan saat memuat data';
      setError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
          title: 'Error!',
          text: data.error || 'Gagal menyimpan currency',
        });
        setError(data.error || 'Gagal menyimpan currency');
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: editingCurrency ? 'Currency berhasil diupdate' : 'Currency berhasil dibuat',
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
      loadData();
    } catch (err) {
      setError('Terjadi kesalahan saat menyimpan currency');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
          title: 'Error!',
          text: data.error || 'Gagal menyimpan category',
        });
        setError(data.error || 'Gagal menyimpan category');
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: editingCategory ? 'Category berhasil diupdate' : 'Category berhasil dibuat',
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
      loadData();
    } catch (err) {
      setError('Terjadi kesalahan saat menyimpan category');
    }
  };

  const handleDeleteCurrency = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Currency ini akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
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
          title: 'Error!',
          text: data.error || 'Gagal menghapus currency',
        });
        setError(data.error || 'Gagal menghapus currency');
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Dihapus!',
        text: 'Currency berhasil dihapus',
        timer: 2000,
        showConfirmButton: false,
      });
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Terjadi kesalahan saat menghapus currency',
      });
      setError('Terjadi kesalahan saat menghapus currency');
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
        setError(data.error || 'Gagal mengupdate exchange rates');
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Exchange rates berhasil diupdate',
        timer: 2000,
        showConfirmButton: false,
      });
      setCurrencies(data.currencies || []);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Terjadi kesalahan saat mengupdate exchange rates',
      });
      setError('Terjadi kesalahan saat mengupdate exchange rates');
    } finally {
      setUpdatingRates(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Category ini akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: data.error || 'Gagal menghapus category',
        });
        setError(data.error || 'Gagal menghapus category');
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Dihapus!',
        text: 'Category berhasil dihapus',
        timer: 2000,
        showConfirmButton: false,
      });
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Terjadi kesalahan saat menghapus category',
      });
      setError('Terjadi kesalahan saat menghapus category');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
          <p className="mt-2 text-gray-600">Kelola currency dan category Anda</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
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
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Currencies
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Categories
            </button>
          </nav>
        </div>

        {/* Currencies Tab */}
        {activeTab === 'currencies' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Currencies</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateExchangeRates}
                  disabled={updatingRates || currencies.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingRates ? 'Updating...' : '🔄 Update Exchange Rates'}
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium text-sm"
                >
                  + Tambah Currency
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="p-6">
                {currencies.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    Belum ada currency. Tambahkan currency pertama Anda.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Symbol
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exchange Rate
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Default
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
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
                                <span className="font-semibold">1.0 (Base)</span>
                              ) : (
                                <span>{currency.exchange_rate.toFixed(6)}</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {currency.is_default ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Default
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => openEditCurrency(currency)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCurrency(currency.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Hapus
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
              <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium text-sm"
              >
                + Tambah Category
              </button>
            </div>

            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
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
                      Income ({categories.filter((c) => c.type === 'income').length})
                    </button>
                    <button
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Outcome ({categories.filter((c) => c.type === 'outcome').length})
                    </button>
                  </div>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    Belum ada category. Tambahkan category pertama Anda.
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
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {category.type === 'income' ? 'Income' : 'Outcome'}
                              </span>
                              {category.is_default && (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
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
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
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
                    {editingCurrency ? 'Edit Currency' : 'Tambah Currency'}
                  </h3>
                  <form onSubmit={handleCurrencySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Currency <span className="text-red-500">*</span>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                          <option value="">Pilih Currency</option>
                          {WORLDWIDE_CURRENCIES.map((currency) => {
                            // Filter out currencies that already exist
                            const exists = currencies.some((c) => c.code === currency.code);
                            return (
                              <option
                                key={currency.code}
                                value={currency.code}
                                disabled={exists}
                              >
                                {currency.code} - {currency.name} {exists && '(Sudah ada)'}
                              </option>
                            );
                          })}
                        </select>
                      )}
                      {editingCurrency && (
                        <p className="mt-1 text-xs text-gray-500">
                          Code tidak dapat diubah saat edit
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={currencyForm.name}
                        onChange={(e) =>
                          setCurrencyForm({ ...currencyForm, name: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="US Dollar"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Symbol
                      </label>
                      <input
                        type="text"
                        value={currencyForm.symbol}
                        onChange={(e) =>
                          setCurrencyForm({ ...currencyForm, symbol: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="$"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Exchange Rate
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={currencyForm.is_default}
                        onChange={(e) =>
                          setCurrencyForm({ ...currencyForm, is_default: e.target.checked })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                        Set as default currency
                      </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCurrencyForm(false);
                          setEditingCurrency(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                      >
                        Simpan
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
                        Type <span className="text-red-500">*</span>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="income">Income</option>
                        <option value="outcome">Outcome</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, name: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_default_cat" className="ml-2 block text-sm text-gray-900">
                        Set as default category
                      </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryForm(false);
                          setEditingCategory(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                      >
                        Simpan
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

