'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import TransactionModal from '@/components/TransactionModal';
import { useI18n } from '@/lib/i18n/context';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalOutcome: 0,
    balance: 0,
    currency: 'IDR',
    baseCurrency: 'IDR',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'outcome' | undefined>(undefined);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');

  useEffect(() => {
    // Load saved currency preference from localStorage
    const savedCurrency = localStorage.getItem('dashboardDisplayCurrency');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }
    loadCurrencies();
  }, []);

  useEffect(() => {
    // Reload stats when currency changes (after currencies are loaded)
    if (selectedCurrency && currencies.length > 0) {
      loadDashboardData(selectedCurrency);
    } else if (currencies.length > 0 && !selectedCurrency) {
      // If currencies loaded but no currency selected yet, wait for loadCurrencies to set it
      // This will be handled by loadCurrencies setting selectedCurrency
    }
  }, [selectedCurrency, currencies.length]);

  const loadCurrencies = async () => {
    try {
      const response = await fetch('/api/currencies', {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setCurrencies(data.currencies || []);
        // If no saved currency, use default currency
        const savedCurrency = localStorage.getItem('dashboardDisplayCurrency');
        if (!savedCurrency && data.currencies) {
          const defaultCurrency = data.currencies.find((c: any) => c.is_default);
          if (defaultCurrency) {
            setSelectedCurrency(defaultCurrency.code);
            localStorage.setItem('dashboardDisplayCurrency', defaultCurrency.code);
          } else if (data.currencies.length > 0) {
            // Fallback to first currency if no default
            setSelectedCurrency(data.currencies[0].code);
            localStorage.setItem('dashboardDisplayCurrency', data.currencies[0].code);
          }
        } else if (savedCurrency) {
          // Verify saved currency exists in user's currencies
          const currencyExists = data.currencies.some((c: any) => c.code === savedCurrency);
          if (!currencyExists && data.currencies.length > 0) {
            // If saved currency doesn't exist, use default or first
            const defaultCurrency = data.currencies.find((c: any) => c.is_default);
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

  const loadDashboardData = async (currency?: string) => {
    setLoading(true);
    try {
      // Use provided currency or selectedCurrency
      const currencyToUse = currency || selectedCurrency;
      
      // Load stats with selected currency
      const statsUrl = currencyToUse
        ? `/api/transactions/stats?displayCurrency=${currencyToUse}`
        : '/api/transactions/stats';
      
      const statsResponse = await fetch(statsUrl, {
        credentials: 'include',
      });
      const statsData = await statsResponse.json();
      if (statsResponse.ok) {
        setStats({
          totalIncome: statsData.totalIncome || 0,
          totalOutcome: statsData.totalOutcome || 0,
          balance: statsData.balance || 0,
          currency: statsData.currency || 'IDR',
          baseCurrency: statsData.baseCurrency || 'IDR',
        });
      }

      // Load recent transactions
      const transactionsResponse = await fetch('/api/transactions?limit=5', {
        credentials: 'include',
      });
      const transactionsData = await transactionsResponse.json();
      if (transactionsResponse.ok) {
        setRecentTransactions(transactionsData.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.dashboard.title}</h1>
            <p className="mt-2 text-gray-600">{t.dashboard.subtitle}</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.dashboard.totalIncome}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: stats.currency || 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(stats.totalIncome)}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.dashboard.totalOutcome}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: stats.currency || 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(stats.totalOutcome)}
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.dashboard.balance}</p>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    stats.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: stats.currency || 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(stats.balance)}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.dashboard.quickActions}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setModalType('income');
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t.dashboard.addIncome}
            </button>
            <button
              onClick={() => {
                setModalType('outcome');
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
              {t.dashboard.addOutcome}
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{t.dashboard.recentTransactions}</h2>
              <Link
                href="/transactions"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t.dashboard.seeAll}
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentTransactions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {t.dashboard.noTransactions}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.dashboard.date}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.dashboard.category}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.dashboard.description}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.dashboard.amountOriginal}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.dashboard.amountConverted} ({stats.currency})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(tx.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              tx.type === 'income'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {tx.category?.name || tx.category || '-'}
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
                            currency: tx.currency?.code || tx.currency || 'IDR',
                            minimumFractionDigits: 0,
                          }).format(parseFloat(tx.amount))}
                        </td>
                        <td
                          className={`px-4 py-4 whitespace-nowrap text-sm font-medium text-right text-gray-600`}
                        >
                          {(() => {
                            const originalCurrency = tx.currency?.code || tx.currency || 'IDR';
                            const originalAmount = parseFloat(tx.amount);
                            
                            // If same currency, no conversion needed
                            if (originalCurrency === stats.currency) {
                              return new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: stats.currency,
                                minimumFractionDigits: 0,
                              }).format(originalAmount);
                            }
                            
                            // Find exchange rates
                            const originalCurrencyData = currencies.find(c => c.code === originalCurrency);
                            const displayCurrencyData = currencies.find(c => c.code === stats.currency);
                            
                            if (!originalCurrencyData || !displayCurrencyData) {
                              return '-';
                            }
                            
                            // Convert: original -> base -> display
                            // First convert to base currency
                            let baseAmount = originalAmount;
                            if (originalCurrency !== stats.baseCurrency) {
                              const originalRate = originalCurrencyData.exchange_rate;
                              if (originalRate > 0) {
                                baseAmount = originalAmount / originalRate;
                              }
                            }
                            
                            // Then convert to display currency
                            let convertedAmount = baseAmount;
                            if (stats.currency !== stats.baseCurrency) {
                              const displayRate = displayCurrencyData.exchange_rate;
                              if (displayRate > 0) {
                                convertedAmount = baseAmount * displayRate;
                              }
                            }
                            
                            return new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: stats.currency,
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
          // Reload dashboard data with current selected currency
          loadDashboardData(selectedCurrency);
        }}
      />
    </div>
  );
}

