'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import TransactionModal from '@/components/TransactionModal';
import TransferModal from '@/components/TransferModal';
import { useI18n } from '@/lib/i18n/context';
import { useCurrency } from '@/lib/currency/context';

export default function DashboardPage() {
  const router = useRouter();
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalOutcome: 0,
    balance: 0,
    currency: 'IDR',
    baseCurrency: 'IDR',
    thisMonthIncome: 0,
    outcomeToday: 0,
    outcomeThisWeek: 0,
    outcomeThisMonth: 0,
    dateInfo: {
      today: '',
      startOfWeek: '',
      startOfMonth: '',
      endOfMonth: '',
    },
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'outcome' | undefined>(undefined);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accountBalances, setAccountBalances] = useState<any[]>([]);
  const [accountBalancesLoading, setAccountBalancesLoading] = useState(true);
  const { selectedCurrency, currencies } = useCurrency();

  useEffect(() => {
    loadCategories();
  }, []);

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

  useEffect(() => {
    // Reload stats when currency changes
    if (selectedCurrency) {
      loadDashboardData(selectedCurrency);
    } else if (currencies.length > 0) {
      // If currencies loaded but no currency selected, wait for CurrencyProvider to set it
      // or load with default
      loadDashboardData();
    } else {
      // Load dashboard with default currency (will be handled by API)
      loadDashboardData();
    }
  }, [selectedCurrency, currencies.length]);

  const loadDashboardData = async (currency?: string) => {
    setLoading(true);
    setStatsLoading(true);
    setTransactionsLoading(true);
    setBudgetsLoading(true);
    setAccountBalancesLoading(true);
    
    try {
      // Use provided currency or selectedCurrency
      const currencyToUse = currency || selectedCurrency;
      
      // Load all data in parallel for faster loading
      const statsUrl = currencyToUse
        ? `/api/transactions/stats?displayCurrency=${currencyToUse}`
        : '/api/transactions/stats';
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // Parallel API calls - each resolves independently for progressive loading
      const promises = [
        fetch(statsUrl, { credentials: 'include' })
          .then(async (response) => {
            if (response.status === 401) {
              router.push('/login');
              setStatsLoading(false);
              return;
            }
            const data = await response.json();
            if (response.ok) {
              setStats({
                totalIncome: data.totalIncome || 0,
                totalOutcome: data.totalOutcome || 0,
                balance: data.balance || 0,
                currency: data.currency || 'IDR',
                baseCurrency: data.baseCurrency || 'IDR',
                thisMonthIncome: data.thisMonthIncome || 0,
                outcomeToday: data.outcomeToday || 0,
                outcomeThisWeek: data.outcomeThisWeek || 0,
                outcomeThisMonth: data.outcomeThisMonth || 0,
                dateInfo: data.dateInfo || {
                  today: '',
                  startOfWeek: '',
                  startOfMonth: '',
                  endOfMonth: '',
                },
              });
            }
            setStatsLoading(false);
          })
          .catch((err) => {
            console.error('Failed to load stats:', err);
            setStatsLoading(false);
          }),
        
        fetch('/api/transactions?limit=5', { credentials: 'include' })
          .then(async (response) => {
            if (response.status === 401) {
              router.push('/login');
              setTransactionsLoading(false);
              return;
            }
            const data = await response.json();
            if (response.ok) {
              setRecentTransactions(data.transactions || []);
            }
            setTransactionsLoading(false);
          })
          .catch((err) => {
            console.error('Failed to load transactions:', err);
            setTransactionsLoading(false);
          }),
        
        fetch(`/api/budgets?year=${currentYear}&month=${currentMonth}`, { credentials: 'include' })
          .then(async (response) => {
            if (response.status === 401) {
              router.push('/login');
              setBudgetsLoading(false);
              return;
            }
            const data = await response.json();
            if (response.ok) {
              setBudgets(data.budgets || []);
            }
            setBudgetsLoading(false);
          })
          .catch((err) => {
            console.error('Failed to load budgets:', err);
            setBudgetsLoading(false);
          }),
        
        fetch('/api/accounts/balances', { credentials: 'include' })
          .then(async (response) => {
            if (response.status === 401) {
              router.push('/login');
              setAccountBalancesLoading(false);
              return;
            }
            const data = await response.json();
            if (response.ok) {
              setAccountBalances(data.accountBalances || []);
            }
            setAccountBalancesLoading(false);
          })
          .catch((err) => {
            console.error('Failed to load account balances:', err);
            setAccountBalancesLoading(false);
          })
      ];

      // Wait for all promises and ensure loading state is cleared
      Promise.allSettled(promises).finally(() => {
        setLoading(false);
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setLoading(false);
      setStatsLoading(false);
      setTransactionsLoading(false);
      setBudgetsLoading(false);
      setAccountBalancesLoading(false);
    }
  };

  // Show initial loading only briefly - don't wait forever
  // If loading takes too long, show content anyway (progressive loading)
  if (loading && currencies.length === 0 && !selectedCurrency) {
    // Only show full loading screen if we don't have currency preference
    // This prevents infinite loading if currencies API fails
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-600">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Decorative background elements - soft and subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2563EB]/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#10B981]/3 rounded-full blur-3xl"></div>
      </div>
      
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Warning Header */}
        {(currencies.length === 0 || categories.length === 0) && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-yellow-700">
                  {currencies.length === 0 && categories.length === 0 && (
                    <>{t.dashboard.warningNoCurrencyAndCategory} {t.dashboard.warningAddInSettings} <Link href="/settings" className="font-semibold underline">{t.nav.settings}</Link> {t.dashboard.warningToStartTransaction}</>
                  )}
                  {currencies.length === 0 && categories.length > 0 && (
                    <>{t.dashboard.warningNoCurrency} {t.dashboard.warningAddInSettings} <Link href="/settings" className="font-semibold underline">{t.nav.settings}</Link> {t.dashboard.warningToStartTransaction}</>
                  )}
                  {currencies.length > 0 && categories.length === 0 && (
                    <>{t.dashboard.warningNoCategory} {t.dashboard.warningAddInSettings} <Link href="/settings" className="font-semibold underline">{t.nav.settings}</Link> {t.dashboard.warningToStartTransaction}</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.dashboard.title}</h1>
              <p className="mt-2 text-gray-600">{t.dashboard.subtitle}</p>
            </div>
            {stats.dateInfo.today && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500">{t.dashboard.today}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(stats.dateInfo.today).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsLoading ? (
            <div className="col-span-3 text-center text-gray-500 py-8">{t.common.loading}</div>
          ) : (
            <>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-[#10B981] hover:shadow-xl transition-shadow">
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
                  className="w-6 h-6 text-[#10B981]"
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

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-[#EF4444] hover:shadow-xl transition-shadow">
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
                  className="w-6 h-6 text-[#EF4444]"
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

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-[#2563EB] hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.dashboard.balance}</p>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    stats.balance >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
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
            </>
          )}
        </div>

        {/* Separator */}
        <div className="my-8 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="px-4 text-sm text-gray-500 font-medium">{t.dashboard.additionalStats}</div>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Additional Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsLoading ? (
            <div className="col-span-4 text-center text-gray-500 py-8">{t.common.loading}</div>
          ) : (
            <>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-[#10B981] hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.dashboard.thisMonthIncome}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: stats.currency || 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(stats.thisMonthIncome)}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-[#10B981]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-[#EF4444] hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{t.dashboard.outcomeToday}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: stats.currency || 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(stats.outcomeToday)}
                </p>
                {stats.dateInfo.today && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(stats.dateInfo.today).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-[#EF4444]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-[#EF4444] hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.dashboard.outcomeThisWeek}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: stats.currency || 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(stats.outcomeThisWeek)}
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-[#EF4444]"
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

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-[#EF4444] hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.dashboard.outcomeThisMonth}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: stats.currency || 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(stats.outcomeThisMonth)}
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-[#EF4444]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.dashboard.quickActions}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setModalType('income');
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center px-6 py-3 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition font-medium"
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
              className="flex items-center justify-center px-6 py-3 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] transition font-medium"
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
            <button
              onClick={() => {
                setIsTransferModalOpen(true);
              }}
              className="flex items-center justify-center px-6 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E40AF] transition font-medium"
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
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Transfer Antar Akun
            </button>
          </div>
        </div>

        {/* Budget Progress */}
        {budgets.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t.budget.title}</h2>
              {(budgets.some((b: any) => b.isExceeded) || budgets.some((b: any) => b.isNearLimit)) && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                  {budgets.filter((b: any) => b.isExceeded).length > 0 && `${budgets.filter((b: any) => b.isExceeded).length} ${t.budget.exceeded}`}
                  {budgets.filter((b: any) => b.isExceeded).length > 0 && budgets.filter((b: any) => b.isNearLimit && !b.isExceeded).length > 0 && ' • '}
                  {budgets.filter((b: any) => b.isNearLimit && !b.isExceeded).length > 0 && `${budgets.filter((b: any) => b.isNearLimit && !b.isExceeded).length} ${t.budget.nearLimit}`}
                </span>
              )}
            </div>
            <div className="space-y-4">
              {budgets.slice(0, 5).map((budget: any) => (
                <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{budget.category?.icon || ''}</span>
                      <span className="font-medium text-gray-900">{budget.category?.name || '-'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: budget.currency?.code || 'IDR',
                          minimumFractionDigits: 0,
                        }).format(budget.spent || 0)}
                        {' / '}
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: budget.currency?.code || 'IDR',
                          minimumFractionDigits: 0,
                        }).format(budget.amount)}
                      </span>
                      {budget.isExceeded && (
                        <span className="ml-2 text-xs text-[#EF4444] font-semibold">({t.budget.exceeded})</span>
                      )}
                      {budget.isNearLimit && !budget.isExceeded && (
                        <span className="ml-2 text-xs text-[#F59E0B] font-semibold">({t.budget.nearLimit})</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        budget.isExceeded
                          ? 'bg-[#EF4444]'
                          : budget.isNearLimit
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#10B981]'
                      }`}
                      style={{ width: `${Math.min(budget.percentage || 0, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{budget.percentage?.toFixed(1)}% {t.budget.progress}</span>
                    <span>
                      {t.budget.remaining}:{' '}
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: budget.currency?.code || 'IDR',
                        minimumFractionDigits: 0,
                      }).format(budget.remaining || 0)}
                    </span>
                  </div>
                </div>
              ))}
              {budgets.length > 5 && (
                <Link
                  href="/settings?tab=budgets"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t.dashboard.seeAll} Budgets
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Account Balances */}
        {accountBalances.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t.dashboard.accountBalances || 'Saldo Akun'}</h2>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Total Saldo (All Accounts)</p>
                <p className="text-sm font-semibold text-gray-700">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: stats.currency || 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(accountBalances.reduce((sum: number, acc: any) => {
                    // Sum all account balances (converted to display currency)
                    const accountCurrency = acc.currency?.code || 'IDR';
                    const displayCurrency = stats.currency || 'IDR';
                    let displayBalance = acc.balance;
                    
                    if (accountCurrency !== displayCurrency && acc.currency && currencies.length > 0) {
                      const accountCurrencyData = currencies.find((c: any) => c.code === accountCurrency);
                      const displayCurrencyData = currencies.find((c: any) => c.code === displayCurrency);
                      
                      if (accountCurrencyData && displayCurrencyData) {
                        let baseAmount = acc.balance;
                        if (accountCurrency !== stats.baseCurrency && accountCurrencyData.exchange_rate > 0) {
                          baseAmount = acc.balance / accountCurrencyData.exchange_rate;
                        }
                        
                        if (displayCurrency !== stats.baseCurrency && displayCurrencyData.exchange_rate > 0) {
                          displayBalance = baseAmount * displayCurrencyData.exchange_rate;
                        } else {
                          displayBalance = baseAmount;
                        }
                      }
                    }
                    
                    return sum + displayBalance;
                  }, 0))}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  (All-time balance from accounts)
                </p>
              </div>
            </div>
            {accountBalancesLoading ? (
              <div className="text-center text-gray-500 py-8">{t.common.loading}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accountBalances.map((account: any) => {
                  const accountCurrency = account.currency?.code || 'IDR';
                  const displayCurrency = stats.currency || 'IDR';
                  
                  // Convert balance to display currency if needed
                  let displayBalance = account.balance;
                  if (accountCurrency !== displayCurrency && account.currency && currencies.length > 0) {
                    const accountCurrencyData = currencies.find((c: any) => c.code === accountCurrency);
                    const displayCurrencyData = currencies.find((c: any) => c.code === displayCurrency);
                    
                    if (accountCurrencyData && displayCurrencyData) {
                      // Convert: account currency -> base -> display currency
                      let baseAmount = account.balance;
                      if (accountCurrency !== stats.baseCurrency && accountCurrencyData.exchange_rate > 0) {
                        baseAmount = account.balance / accountCurrencyData.exchange_rate;
                      }
                      
                      if (displayCurrency !== stats.baseCurrency && displayCurrencyData.exchange_rate > 0) {
                        displayBalance = baseAmount * displayCurrencyData.exchange_rate;
                      } else {
                        displayBalance = baseAmount;
                      }
                    }
                  }
                  
                  return (
                    <div
                      key={account.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{account.name}</h3>
                            {account.is_default && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-[#059669]">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-1">
                            {account.type === 'cash' && 'Tunai'}
                            {account.type === 'bank' && 'Bank'}
                            {account.type === 'credit_card' && 'Kartu Kredit'}
                            {account.type === 'investment' && 'Investasi'}
                            {account.type === 'other' && 'Lainnya'}
                          </p>
                          {account.account_number && (
                            <p className="text-xs text-gray-400">{account.account_number}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Saldo</p>
                        <p
                          className={`text-xl font-bold ${
                            displayBalance >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                          }`}
                        >
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: displayCurrency,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          }).format(displayBalance)}
                        </p>
                        {accountCurrency !== displayCurrency && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: accountCurrency,
                              minimumFractionDigits: 0,
                            }).format(account.balance)}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {account.transactionCount || 0} transaksi
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

            {/* Recent Transactions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow">
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
            {transactionsLoading ? (
              <div className="text-center text-gray-500 py-8">{t.common.loading}</div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {t.dashboard.noTransactions}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/80 backdrop-blur-sm">
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.settings.accounts}
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
                          {new Date(tx.date).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            tx.type === 'income'
                              ? 'bg-green-100 text-[#059669]'
                              : 'bg-red-100 text-[#DC2626]'
                          }`}
                          >
                            {tx.category?.name || tx.category || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {tx.description || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.account ? (
                            <div>
                              <div className="font-medium text-gray-900">{tx.account.name}</div>
                              {tx.account.account_number && (
                                <div className="text-xs text-gray-400">{tx.account.account_number}</div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td
                          className={`px-4 py-4 whitespace-nowrap text-sm font-medium text-right ${
                            tx.type === 'income' ? 'text-[#10B981]' : 'text-[#EF4444]'
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

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
        }}
        onSuccess={() => {
          // Reload dashboard data with current selected currency
          loadDashboardData(selectedCurrency);
        }}
      />
    </div>
  );
}

