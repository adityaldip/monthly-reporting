'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import TransactionModal from '@/components/TransactionModal';
import { Transaction } from '@/types/transaction';
import { useI18n } from '@/lib/i18n/context';

export default function TransactionsPage() {
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'outcome' | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'outcome'>('all');
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [baseCurrency, setBaseCurrency] = useState<string>('IDR');

  useEffect(() => {
    // Load saved currency preference from localStorage
    const savedCurrency = localStorage.getItem('dashboardDisplayCurrency');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }
    loadCurrencies();
    loadTransactions();
  }, []);

  useEffect(() => {
    // Reload transactions when filter or currency changes
    if (currencies.length > 0) {
      loadTransactions();
    }
  }, [filterType, selectedCurrency, currencies.length]);

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

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const url = filterType === 'all' 
        ? '/api/transactions'
        : `/api/transactions?type=${filterType}`;
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (response.ok) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.transactions.title}</h1>
              <p className="mt-2 text-gray-600">{t.transactions.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setModalType('income');
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm sm:text-base"
              >
                + Pemasukan
              </button>
              <button
                onClick={() => {
                  setModalType('outcome');
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm sm:text-base"
              >
                + Pengeluaran
              </button>
            </div>
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {currencies.map((curr) => (
                <option key={curr.id} value={curr.code}>
                  {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filterType === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setFilterType('outcome')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filterType === 'outcome'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pengeluaran
          </button>
        </div>

        {/* Transactions List */}
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
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
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
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
                          tx.type === 'income' ? 'text-green-600' : 'text-red-600'
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalType(undefined);
        }}
        type={modalType}
        onSuccess={() => {
          loadTransactions();
        }}
      />
    </div>
  );
}

