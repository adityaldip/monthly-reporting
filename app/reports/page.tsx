'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useI18n } from '@/lib/i18n/context';
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
}

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function ReportsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    loadReportsData();
  }, [selectedYear, selectedMonth]);

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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency || 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
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
      <div className="min-h-screen bg-gray-50">
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 py-8">{t.reports.noData}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-sm font-medium text-gray-600">{t.reports.totalIncome}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(reportsData.summary.totalIncome, reportsData.summary.currency)}
            </p>
            {reportsData.insights.incomeGrowth !== 0 && (
              <p
                className={`text-sm mt-1 ${
                  reportsData.insights.incomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatPercent(reportsData.insights.incomeGrowth)} {t.reports.comparedToPrevious}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-sm font-medium text-gray-600">{t.reports.totalOutcome}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(reportsData.summary.totalOutcome, reportsData.summary.currency)}
            </p>
            {reportsData.insights.outcomeGrowth !== 0 && (
              <p
                className={`text-sm mt-1 ${
                  reportsData.insights.outcomeGrowth <= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatPercent(reportsData.insights.outcomeGrowth)} {t.reports.comparedToPrevious}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-sm font-medium text-gray-600">{t.reports.balance}</p>
            <p
              className={`text-2xl font-bold mt-2 ${
                reportsData.summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
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
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Balance"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

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
                  reportsData.insights.incomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatPercent(reportsData.insights.incomeGrowth)}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
