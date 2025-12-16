'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useI18n } from '@/lib/i18n/context';
import { useCurrency } from '@/lib/currency/context';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ReportsData {
  period: {
    year: number;
    month: number | null;
  };
  summary: {
    totalIncome: number;
    totalOutcome: number;
    balance: number;
    currency: string;
    totalTransactions: number;
    avgTransactionAmount: number;
  };
  monthlyTrends: Array<{
    month: number;
    monthName: string;
    income: number;
    outcome: number;
    balance: number;
  }>;
  dailyTrends: Array<{
    date: string;
    day: number;
    income: number;
    outcome: number;
    balance: number;
  }>;
  balanceChartData: Array<{
    date: string;
    day: number;
    week: number;
    month: number;
    balance: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    value: number;
    icon: string;
    color: string;
    count: number;
  }>;
  insights: {
    topCategory: {
      name: string;
      value: number;
      icon: string;
      color: string;
    } | null;
    avgCategorySpending: number;
    incomeGrowth: number;
    outcomeGrowth: number;
    prevPeriod: {
      totalIncome: number;
      totalOutcome: number;
    };
  };
  budgetComparison?: Array<{
    id: string;
    category: {
      name: string;
      icon?: string;
      color?: string;
    };
    budgetAmount: number;
    spent: number;
    remaining: number;
    percentage: number;
    isExceeded: boolean;
    isNearLimit: boolean;
    currency: {
      code: string;
    };
  }>;
}

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function ReportsPage() {
  const { t } = useI18n();
  const { selectedCurrency, currencies } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showDateRangeFilter, setShowDateRangeFilter] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [balanceChartView, setBalanceChartView] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    loadReportsData();
    // Reset date range filter when month changes
    setDateRangeStart('');
    setDateRangeEnd('');
  }, [selectedYear, selectedMonth, selectedCurrency]);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const url = selectedMonth
        ? `/api/reports?year=${selectedYear}&month=${selectedMonth}`
        : `/api/reports?year=${selectedYear}`;

      const response = await fetch(url, {
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setReportsData(data);
      } else {
        console.error('Failed to load reports:', data.error);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency || !toCurrency) {
      return amount;
    }

    const fromCurrencyData = currencies.find((c) => c.code === fromCurrency);
    const toCurrencyData = currencies.find((c) => c.code === toCurrency);

    if (!fromCurrencyData || !toCurrencyData) {
      return amount;
    }

    // Convert: fromCurrency -> base -> toCurrency
    // First convert to base currency
    let baseAmount = amount;
    if (fromCurrencyData.exchange_rate > 0) {
      baseAmount = amount / fromCurrencyData.exchange_rate;
    }

    // Then convert to target currency
    if (toCurrencyData.exchange_rate > 0) {
      return baseAmount * toCurrencyData.exchange_rate;
    }

    return baseAmount;
  };

  const formatCurrency = (amount: number, currency: string) => {
    const displayCurrency = selectedCurrency || currency || 'IDR';
    const convertedAmount = convertAmount(amount, currency, displayCurrency);
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(convertedAmount);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // Generate month options
  const monthOptions = [
    { value: '', label: t.reports.allMonths },
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">{t.reports.loading}</div>
          </div>
        </main>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 py-8">{t.reports.noData}</div>
        </main>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.reports.title}</h1>
            <p className="mt-2 text-gray-600">{t.reports.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white"
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#10B981]">
            <p className="text-sm font-medium text-gray-600">{t.reports.totalIncome}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(reportsData.summary.totalIncome, reportsData.summary.currency)}
            </p>
            {reportsData.insights.incomeGrowth !== 0 && (
              <p
                className={`text-sm mt-1 ${
                  reportsData.insights.incomeGrowth >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {formatPercent(reportsData.insights.incomeGrowth)} {t.reports.comparedToPrevious}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#EF4444]">
            <p className="text-sm font-medium text-gray-600">{t.reports.totalOutcome}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(reportsData.summary.totalOutcome, reportsData.summary.currency)}
            </p>
            {reportsData.insights.outcomeGrowth !== 0 && (
              <p
                className={`text-sm mt-1 ${
                  reportsData.insights.outcomeGrowth <= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {formatPercent(reportsData.insights.outcomeGrowth)} {t.reports.comparedToPrevious}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#2563EB]">
            <p className="text-sm font-medium text-gray-600">{t.reports.balance}</p>
            <p
              className={`text-2xl font-bold mt-2 ${
                reportsData.summary.balance >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}
            >
              {formatCurrency(reportsData.summary.balance, reportsData.summary.currency)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p className="text-sm font-medium text-gray-600">{t.reports.totalTransactions}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {reportsData.summary.totalTransactions}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {t.reports.avgTransaction}:{' '}
              {formatCurrency(reportsData.summary.avgTransactionAmount, reportsData.summary.currency)}
            </p>
          </div>
        </div>

        {/* Monthly Trends Chart */}
        {!selectedMonth && reportsData.monthlyTrends.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.reports.monthlyTrends}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportsData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, reportsData.summary.currency)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="outcome"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Outcome"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Daily Trends Chart */}
        {reportsData.dailyTrends && reportsData.dailyTrends.length > 0 && (() => {
          // Get min and max dates from daily trends
          const minDate = reportsData.dailyTrends[0]?.date || '';
          const maxDate = reportsData.dailyTrends[reportsData.dailyTrends.length - 1]?.date || '';
          
          // Filter daily trends by date range if set
          let filteredDailyTrends = reportsData.dailyTrends;
          if (dateRangeStart && dateRangeEnd) {
            filteredDailyTrends = reportsData.dailyTrends.filter(
              (day) => day.date >= dateRangeStart && day.date <= dateRangeEnd
            );
          } else if (dateRangeStart) {
            filteredDailyTrends = reportsData.dailyTrends.filter(
              (day) => day.date >= dateRangeStart
            );
          } else if (dateRangeEnd) {
            filteredDailyTrends = reportsData.dailyTrends.filter(
              (day) => day.date <= dateRangeEnd
            );
          }

          return (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Daily Trends</h2>
                <button
                  onClick={() => setShowDateRangeFilter(true)}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter Date Range
                </button>
              </div>
              {(dateRangeStart || dateRangeEnd) && (
                <div className="mb-4 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3">
                  <span className="font-medium">Filtered:</span> {dateRangeStart || minDate} to {dateRangeEnd || maxDate}
                  <button
                    onClick={() => {
                      setDateRangeStart('');
                      setDateRangeEnd('');
                    }}
                    className="ml-2 text-[#2563EB] hover:text-[#1E40AF] underline font-medium"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredDailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    label={{ value: 'Day', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, reportsData.summary.currency)}
                    labelFormatter={(label) => {
                      const dayData = filteredDailyTrends.find(d => d.day === label);
                      return dayData ? `Day ${label} (${dayData.date})` : `Day ${label}`;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Income"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="outcome"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="Outcome"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Balance Chart */}
        {reportsData.balanceChartData && Array.isArray(reportsData.balanceChartData) && reportsData.balanceChartData.length > 0 && (() => {
          // Process data based on view type
          let chartData: Array<{ label: string; balance: number }> = [];
          
          if (balanceChartView === 'day') {
            chartData = reportsData.balanceChartData.map((item) => ({
              label: `${item.day}`,
              balance: item.balance,
            }));
          } else if (balanceChartView === 'week') {
            // Group by week
            const weekData: Record<number, number> = {};
            reportsData.balanceChartData.forEach((item) => {
              const weekKey = item.week;
              // Use the last balance of the week
              weekData[weekKey] = item.balance;
            });
            chartData = Object.entries(weekData)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([week, balance]) => ({
                label: `Week ${week}`,
                balance: balance as number,
              }));
          } else if (balanceChartView === 'month') {
            // Group by month
            const monthData: Record<number, number> = {};
            reportsData.balanceChartData.forEach((item) => {
              const monthKey = item.month;
              // Use the last balance of the month
              monthData[monthKey] = item.balance;
            });
            chartData = Object.entries(monthData)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([month, balance]) => ({
                label: new Date(2000, parseInt(month) - 1).toLocaleString('default', { month: 'short' }),
                balance: balance as number,
              }));
          }

          return (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Balance Accumulation</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBalanceChartView('day')}
                    className={`px-3 py-1.5 text-sm rounded-md transition font-medium ${
                      balanceChartView === 'day'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setBalanceChartView('week')}
                    className={`px-3 py-1.5 text-sm rounded-md transition font-medium ${
                      balanceChartView === 'week'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setBalanceChartView('month')}
                    className={`px-3 py-1.5 text-sm rounded-md transition font-medium ${
                      balanceChartView === 'month'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Month
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, reportsData.summary.currency)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#2563EB"
                    strokeWidth={2}
                    name="Balance"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Category Breakdown */}
        {reportsData.categoryBreakdown.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t.reports.categoryBreakdown}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportsData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportsData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, reportsData.summary.currency)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t.reports.categoryBreakdown} (Bar)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportsData.categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, reportsData.summary.currency)}
                  />
                  <Bar dataKey="value" fill="#3B82F6">
                    {reportsData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Budget vs Actual Comparison */}
        {reportsData.budgetComparison && reportsData.budgetComparison.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.budget.budgetVsActual}</h2>
            <div className="space-y-4">
              {reportsData.budgetComparison.map((budget) => (
                <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{budget.category?.icon || ''}</span>
                      <span className="font-medium text-gray-900">{budget.category?.name || '-'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">
                        {formatCurrency(budget.spent, reportsData.summary.currency)}
                        {' / '}
                        {formatCurrency(budget.budgetAmount, reportsData.summary.currency)}
                      </span>
                      {budget.isExceeded && (
                        <span className="ml-2 text-xs text-[#EF4444] font-semibold">({t.budget.exceeded})</span>
                      )}
                      {budget.isNearLimit && !budget.isExceeded && (
                        <span className="ml-2 text-xs text-[#F59E0B] font-semibold">({t.budget.nearLimit})</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        budget.isExceeded
                          ? 'bg-[#EF4444]'
                          : budget.isNearLimit
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#10B981]'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {t.budget.budget}: {formatCurrency(budget.budgetAmount, reportsData.summary.currency)}
                    </span>
                    <span className="text-gray-600">
                      {t.budget.actual}: {formatCurrency(budget.spent, reportsData.summary.currency)}
                    </span>
                    <span className={budget.remaining < 0 ? 'text-[#EF4444] font-semibold' : 'text-gray-600'}>
                      {t.budget.remaining}: {formatCurrency(budget.remaining, reportsData.summary.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.reports.insights}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reportsData.insights.topCategory && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">{t.reports.topCategory}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl">{reportsData.insights.topCategory.icon}</span>
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {reportsData.insights.topCategory.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(
                        reportsData.insights.topCategory.value,
                        reportsData.summary.currency
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600">{t.reports.avgCategorySpending}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(reportsData.insights.avgCategorySpending, reportsData.summary.currency)}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600">{t.reports.incomeGrowth}</p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  reportsData.insights.incomeGrowth >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {formatPercent(reportsData.insights.incomeGrowth)}
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Filter Modal */}
        {showDateRangeFilter && reportsData.dailyTrends && reportsData.dailyTrends.length > 0 && (() => {
          const minDate = reportsData.dailyTrends[0]?.date || '';
          const maxDate = reportsData.dailyTrends[reportsData.dailyTrends.length - 1]?.date || '';
          
          return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
                onClick={() => setShowDateRangeFilter(false)}
              />

              {/* Modal */}
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Filter Date Range</h2>
                    <button
                      onClick={() => setShowDateRangeFilter(false)}
                      className="text-gray-400 hover:text-gray-600 transition"
                      aria-label="Close"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Form */}
                  <div className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-900 mb-1">
                          Start Date
                        </label>
                        <input
                          id="start-date"
                          type="date"
                          value={dateRangeStart}
                          onChange={(e) => setDateRangeStart(e.target.value)}
                          min={minDate}
                          max={maxDate}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                        />
                      </div>

                      <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-900 mb-1">
                          End Date
                        </label>
                        <input
                          id="end-date"
                          type="date"
                          value={dateRangeEnd}
                          onChange={(e) => setDateRangeEnd(e.target.value)}
                          min={dateRangeStart || minDate}
                          max={maxDate}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                        />
                      </div>

                      <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3">
                        <p className="font-medium mb-1">Available range:</p>
                        <p>{minDate} to {maxDate}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setDateRangeStart('');
                          setDateRangeEnd('');
                          setShowDateRangeFilter(false);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition font-medium"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDateRangeFilter(false)}
                        className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1E40AF] transition font-medium"
                      >
                        Apply Filter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
