'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import TransactionModal from '@/components/TransactionModal';
import RecurringTransactionModal from '@/components/RecurringTransactionModal';
import { Transaction } from '@/types/transaction';
import { useI18n } from '@/lib/i18n/context';
import Swal from 'sweetalert2';

export default function TransactionsPage() {
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'outcome' | undefined>(undefined);
  const [editingTransactionId, setEditingTransactionId] = useState<string | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // All transactions for client-side filtering
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'outcome'>('all');
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [baseCurrency, setBaseCurrency] = useState<string>('IDR');
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterCurrency, setFilterCurrency] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [amountMin, setAmountMin] = useState<string>('');
  const [amountMax, setAmountMax] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Sort state
  const [sortField, setSortField] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Bulk delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Recurring transactions state
  const [activeTab, setActiveTab] = useState<'transactions' | 'recurring'>('transactions');
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingRecurringId, setEditingRecurringId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Load saved currency preference from localStorage
    const savedCurrency = localStorage.getItem('dashboardDisplayCurrency');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }
    loadCurrencies();
    loadCategories();
    loadTransactions();
  }, []);

  useEffect(() => {
    // Apply filters and sort when dependencies change
    applyFiltersAndSort();
  }, [filterType, searchQuery, filterCategory, filterCurrency, dateFrom, dateTo, amountMin, amountMax, sortField, sortOrder, allTransactions]);

  const loadCurrencies = async () => {
    try {
      const response = await fetch('/api/currencies', {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setCurrencies(data.currencies || []);
        // Find base currency
        const defaultCurrency = data.currencies.find((c: any) => c.is_default);
        if (defaultCurrency) {
          setBaseCurrency(defaultCurrency.code);
        }
        // If no saved currency, use default currency
        const savedCurrency = localStorage.getItem('dashboardDisplayCurrency');
        if (!savedCurrency && data.currencies) {
          if (defaultCurrency) {
            setSelectedCurrency(defaultCurrency.code);
            localStorage.setItem('dashboardDisplayCurrency', defaultCurrency.code);
          } else if (data.currencies.length > 0) {
            setSelectedCurrency(data.currencies[0].code);
            localStorage.setItem('dashboardDisplayCurrency', data.currencies[0].code);
          }
        } else if (savedCurrency) {
          // Verify saved currency exists
          const currencyExists = data.currencies.some((c: any) => c.code === savedCurrency);
          if (!currencyExists && data.currencies.length > 0) {
            const currencyToUse = defaultCurrency || data.currencies[0];
            setSelectedCurrency(currencyToUse.code);
            localStorage.setItem('dashboardDisplayCurrency', currencyToUse.code);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load currencies:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
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

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const url = '/api/transactions';
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (response.ok) {
        setAllTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering and sorting
  const applyFiltersAndSort = () => {
    let filtered = [...allTransactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => {
        const description = (tx.description || '').toLowerCase();
        const categoryName = ((tx as any).category?.name || tx.category || '').toLowerCase();
        const amount = tx.amount.toString();
        return description.includes(query) || categoryName.includes(query) || amount.includes(query);
      });
    }

    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter(tx => {
        const categoryId = (tx as any).category_id || tx.category;
        return categoryId === filterCategory || (tx as any).category?.id === filterCategory;
      });
    }

    // Filter by currency
    if (filterCurrency) {
      filtered = filtered.filter(tx => {
        const currencyCode = (tx as any).currency?.code || tx.currency;
        return currencyCode === filterCurrency || (tx as any).currency_id === filterCurrency;
      });
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(tx => tx.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(tx => tx.date <= dateTo);
    }

    // Filter by amount range
    if (amountMin) {
      const min = parseFloat(amountMin);
      if (!isNaN(min)) {
        filtered = filtered.filter(tx => parseFloat(tx.amount.toString()) >= min);
      }
    }
    if (amountMax) {
      const max = parseFloat(amountMax);
      if (!isNaN(max)) {
        filtered = filtered.filter(tx => parseFloat(tx.amount.toString()) <= max);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        aValue = parseFloat(a.amount.toString());
        bValue = parseFloat(b.amount.toString());
      } else if (sortField === 'category') {
        aValue = ((a as any).category?.name || a.category || '').toLowerCase();
        bValue = ((b as any).category?.name || b.category || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setTransactions(filtered);
  };

  const handleEdit = (transactionId: string) => {
    const tx = allTransactions.find(t => t.id === transactionId);
    if (tx) {
      setEditingTransactionId(transactionId);
      setModalType(tx.type);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (transactionId: string) => {
    const result = await Swal.fire({
      title: t.transactions.confirmDelete,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: t.common.yes,
      cancelButtonText: t.common.no,
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/transactions/${transactionId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: t.transactions.deleteSuccess,
            timer: 2000,
            showConfirmButton: false,
          });
          loadTransactions();
        } else {
          const data = await response.json();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.error || 'Gagal menghapus transaksi',
          });
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Terjadi kesalahan saat menghapus transaksi',
        });
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const result = await Swal.fire({
      title: t.transactions.confirmBulkDelete.replace('{count}', selectedIds.size.toString()),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: t.common.yes,
      cancelButtonText: t.common.no,
    });

    if (result.isConfirmed) {
      try {
        // Delete all selected transactions
        const deletePromises = Array.from(selectedIds).map(id =>
          fetch(`/api/transactions/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        );

        await Promise.all(deletePromises);

        Swal.fire({
          icon: 'success',
          title: `${selectedIds.size} transaksi berhasil dihapus`,
          timer: 2000,
          showConfirmButton: false,
        });

        setSelectedIds(new Set());
        loadTransactions();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Terjadi kesalahan saat menghapus transaksi',
        });
      }
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(tx => tx.id)));
    }
  };

  const loadRecurringTransactions = async () => {
    try {
      const response = await fetch('/api/recurring-transactions', {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (response.ok) {
        setRecurringTransactions(data.recurringTransactions || []);
      }
    } catch (err) {
      console.error('Failed to load recurring transactions:', err);
    }
  };

  const handleProcessRecurring = async () => {
    try {
      const response = await fetch('/api/recurring-transactions/process', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: data.message,
          timer: 2000,
          showConfirmButton: false,
        });
        loadRecurringTransactions();
        loadTransactions();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'Gagal memproses recurring transactions',
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan saat memproses recurring transactions',
      });
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Recurring Transaction?',
      text: 'Apakah Anda yakin ingin menghapus recurring transaction ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: t.common.yes,
      cancelButtonText: t.common.no,
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/recurring-transactions/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Recurring transaction berhasil dihapus',
            timer: 2000,
            showConfirmButton: false,
          });
          loadRecurringTransactions();
        } else {
          const data = await response.json();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.error || 'Gagal menghapus recurring transaction',
          });
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Terjadi kesalahan saat menghapus recurring transaction',
        });
      }
    }
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
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.transactions.title}</h1>
              <p className="mt-2 text-gray-600">{t.transactions.subtitle}</p>
            </div>
            <div className="flex gap-2">
              {activeTab === 'transactions' ? (
                <>
                  <button
                    onClick={() => {
                      setModalType('income');
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition font-medium text-sm sm:text-base"
                  >
                    {t.transactions.addIncome}
                  </button>
                  <button
                    onClick={() => {
                      setModalType('outcome');
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] transition font-medium text-sm sm:text-base"
                  >
                    {t.transactions.addOutcome}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleProcessRecurring}
                    className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E40AF] transition font-medium text-sm sm:text-base"
                  >
                    Process Recurring
                  </button>
                  <button
                    onClick={() => {
                      setEditingRecurringId(undefined);
                      setIsRecurringModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition font-medium text-sm sm:text-base"
                  >
                    {t.transactions.addRecurring}
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.transactions.title}
              </button>
              <button
                onClick={() => setActiveTab('recurring')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recurring'
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.transactions.recurringTransactions}
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="currency-select" className="text-sm font-medium text-gray-700">
              {t.dashboard.displayIn}:
            </label>
            <select
              id="currency-select"
              value={selectedCurrency}
              onChange={(e) => {
                const newCurrency = e.target.value;
                setSelectedCurrency(newCurrency);
                localStorage.setItem('dashboardDisplayCurrency', newCurrency);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white"
            >
              {currencies.map((curr) => (
                <option key={curr.id} value={curr.code}>
                  {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Filter - Only show for transactions tab */}
        {activeTab === 'transactions' && (
          <>
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t.transactions.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="mb-6 space-y-4">
          {/* Type Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filterType === 'all'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.common.all}
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filterType === 'income'
                  ? 'bg-[#10B981] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.transactions.income}
            </button>
            <button
              onClick={() => setFilterType('outcome')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filterType === 'outcome'
                  ? 'bg-[#EF4444] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.transactions.outcome}
            </button>
          </div>

          {/* Sort & Advanced Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{t.transactions.sortBy}:</label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as 'date' | 'amount' | 'category')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white text-sm"
              >
                <option value="date">{t.transactions.sortDate}</option>
                <option value="amount">{t.transactions.sortAmount}</option>
                <option value="category">{t.transactions.sortCategory}</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 text-sm"
                title={sortOrder === 'asc' ? t.transactions.sortDesc : t.transactions.sortAsc}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 text-sm font-medium"
            >
              {t.transactions.filter} {showAdvancedFilters ? '▲' : '▼'}
            </button>

            {/* Bulk Delete Button */}
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-[#EF4444] text-white rounded-md hover:bg-[#DC2626] transition text-sm font-medium"
              >
                {t.transactions.bulkDelete} ({selectedIds.size})
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.transactions.category}
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white text-sm"
                  >
                    <option value="">{t.transactions.selectCategory}</option>
                    {categories
                      .filter(cat => filterType === 'all' || cat.type === filterType)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Currency Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.transactions.currency}
                  </label>
                  <select
                    value={filterCurrency}
                    onChange={(e) => setFilterCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white text-sm"
                  >
                    <option value="">{t.transactions.selectCurrency}</option>
                    {currencies.map((curr) => (
                      <option key={curr.id} value={curr.code}>
                        {curr.code} - {curr.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.transactions.dateFrom}
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white text-sm"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.transactions.dateTo}
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white text-sm"
                  />
                </div>

                {/* Amount Min */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.transactions.amountMin}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white text-sm"
                  />
                </div>

                {/* Amount Max */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.transactions.amountMax}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white text-sm"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setFilterCategory('');
                  setFilterCurrency('');
                  setDateFrom('');
                  setDateTo('');
                  setAmountMin('');
                  setAmountMax('');
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
          </>
        )}

        {/* Transactions List */}
        {activeTab === 'transactions' ? (
          <div className="bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center text-gray-500">{t.common.loading}</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {t.transactions.noTransactions}
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === transactions.length && transactions.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.transactions.date}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.transactions.category}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.transactions.description}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.transactions.amountOriginal}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.transactions.amountConverted} ({selectedCurrency || 'IDR'})
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.transactions.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(tx.id)}
                          onChange={() => toggleSelect(tx.id)}
                          className="rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(tx.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              tx.type === 'income'
                                ? 'bg-green-100 text-[#059669]'
                                : 'bg-red-100 text-[#DC2626]'
                            }`}
                        >
                          {(tx as any).category?.name || tx.category || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {tx.description || '-'}
                      </td>
                      <td
                          className={`px-4 py-4 whitespace-nowrap text-sm font-medium text-right ${
                            tx.type === 'income' ? 'text-[#10B981]' : 'text-[#EF4444]'
                          }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: (tx as any).currency?.code || tx.currency || 'IDR',
                          minimumFractionDigits: 0,
                        }).format(parseFloat(tx.amount.toString()))}
                      </td>
                      <td
                        className="px-4 py-4 whitespace-nowrap text-sm font-medium text-right text-gray-600"
                      >
                        {(() => {
                          const originalCurrency = (tx as any).currency?.code || tx.currency || 'IDR';
                          const originalAmount = parseFloat(tx.amount.toString());
                          const displayCurrency = selectedCurrency || baseCurrency;
                          
                          // If same currency, no conversion needed
                          if (originalCurrency === displayCurrency) {
                            return new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: displayCurrency,
                              minimumFractionDigits: 0,
                            }).format(originalAmount);
                          }
                          
                          // Find exchange rates
                          const originalCurrencyData = currencies.find(c => c.code === originalCurrency);
                          const displayCurrencyData = currencies.find(c => c.code === displayCurrency);
                          
                          if (!originalCurrencyData || !displayCurrencyData) {
                            return '-';
                          }
                          
                          // Convert: original -> base -> display
                          // First convert to base currency
                          let baseAmount = originalAmount;
                          if (originalCurrency !== baseCurrency) {
                            const originalRate = originalCurrencyData.exchange_rate;
                            if (originalRate > 0) {
                              baseAmount = originalAmount / originalRate;
                            } else {
                              return '-';
                            }
                          }
                          
                          // Then convert to display currency
                          let convertedAmount = baseAmount;
                          if (displayCurrency !== baseCurrency) {
                            const displayRate = displayCurrencyData.exchange_rate;
                            if (displayRate > 0) {
                              convertedAmount = baseAmount * displayRate;
                            } else {
                              return '-';
                            }
                          }
                          
                          return new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: displayCurrency,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          }).format(convertedAmount);
                        })()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(tx.id)}
                            className="text-[#2563EB] hover:text-[#1E40AF] transition"
                            title={t.transactions.edit}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="text-[#EF4444] hover:text-[#DC2626] transition"
                            title={t.transactions.delete}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
        ) : (
          /* Recurring Transactions List */
          <div className="bg-white rounded-lg shadow">
            {recurringTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Belum ada recurring transactions. Tambahkan recurring transaction untuk auto-create transaksi.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.transactions.category}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.transactions.description}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.transactions.amount}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.transactions.frequency}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.transactions.nextDate}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.transactions.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recurringTransactions.map((rt) => (
                      <tr key={rt.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              rt.type === 'income'
                                ? 'bg-green-100 text-[#059669]'
                                : 'bg-red-100 text-[#DC2626]'
                            }`}
                          >
                            {rt.category_data?.icon} {rt.category_data?.name || rt.category || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {rt.description || '-'}
                        </td>
                        <td
                          className={`px-4 py-4 whitespace-nowrap text-sm font-medium text-right ${
                            rt.type === 'income' ? 'text-[#10B981]' : 'text-[#EF4444]'
                          }`}
                        >
                          {rt.type === 'income' ? '+' : '-'}
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: rt.currency_data?.code || rt.currency || 'IDR',
                            minimumFractionDigits: 0,
                          }).format(parseFloat(rt.amount.toString()))}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {rt.frequency === 'weekly' ? t.transactions.weekly : t.transactions.monthly}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(rt.next_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              rt.is_active
                                ? 'bg-green-100 text-[#059669]'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {rt.is_active ? t.transactions.active : t.transactions.inactive}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDeleteRecurring(rt.id)}
                            className="text-[#EF4444] hover:text-[#DC2626] transition"
                            title={t.transactions.delete}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalType(undefined);
          setEditingTransactionId(undefined);
        }}
        type={modalType}
        transactionId={editingTransactionId}
        onSuccess={() => {
          loadTransactions();
          setEditingTransactionId(undefined);
        }}
      />

      {/* Recurring Transaction Modal */}
      <RecurringTransactionModal
        isOpen={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setEditingRecurringId(undefined);
        }}
        recurringTransactionId={editingRecurringId}
        onSuccess={() => {
          loadRecurringTransactions();
          setEditingRecurringId(undefined);
        }}
      />
    </div>
  );
}

