'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const { t, language, setLanguage } = useI18n();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path: string) => {
    return pathname === path ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600';
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              Monthly Tracker
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/dashboard')}`}
              >
                {t.nav.dashboard}
              </Link>
              <Link
                href="/transactions"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/transactions')}`}
              >
                {t.nav.transactions}
              </Link>
              <Link
                href="/reports"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/reports')}`}
              >
                {t.nav.reports}
              </Link>
              <Link
                href="/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/settings')}`}
              >
                {t.nav.settings}
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              aria-label="Select language"
            >
              <option value="id">🇮🇩 ID</option>
              <option value="en">🇬🇧 EN</option>
            </select>
            <Link
              href="/profile"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/profile')}`}
            >
              {t.nav.profile}
            </Link>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition disabled:opacity-50"
            >
              {loading ? t.common.loading : t.nav.logout}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

