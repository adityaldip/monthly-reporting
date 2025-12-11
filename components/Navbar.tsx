'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useCurrency } from '@/lib/currency/context';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, language, setLanguage } = useI18n();
  const { selectedCurrency, setSelectedCurrency, currencies } = useCurrency();

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
    return pathname === path ? 'text-[#2563EB] font-semibold' : 'text-gray-700 hover:text-[#2563EB]';
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link 
              href="/dashboard" 
              className="text-xl font-bold text-gray-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Monthly Tracker
            </Link>
            {/* Desktop Menu */}
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
                href="/goals"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/goals')}`}
              >
                {t.nav.goals}
              </Link>
              <Link
                href="/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/settings')}`}
              >
                {t.nav.settings}
              </Link>
            </div>
          </div>
          
          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Currency Selector */}
            {currencies.length > 0 && (
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white"
                aria-label="Select currency"
              >
                {currencies.map((curr) => (
                  <option key={curr.id} value={curr.code}>
                    {curr.code} {curr.is_default && '(Default)'}
                  </option>
                ))}
              </select>
            )}
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white"
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
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#EF4444] transition disabled:opacity-50"
            >
              {loading ? t.common.loading : t.nav.logout}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {currencies.length > 0 && (
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white"
                aria-label="Select currency"
              >
                {currencies.map((curr) => (
                  <option key={curr.id} value={curr.code}>
                    {curr.code}
                  </option>
                ))}
              </select>
            )}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 bg-white"
              aria-label="Select language"
            >
              <option value="id">🇮🇩 ID</option>
              <option value="en">🇬🇧 EN</option>
            </select>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/dashboard')}`}
              >
                {t.nav.dashboard}
              </Link>
              <Link
                href="/transactions"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/transactions')}`}
              >
                {t.nav.transactions}
              </Link>
              <Link
                href="/reports"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/reports')}`}
              >
                {t.nav.reports}
              </Link>
              <Link
                href="/goals"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/goals')}`}
              >
                {t.nav.goals}
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/settings')}`}
              >
                {t.nav.settings}
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/profile')}`}
              >
                {t.nav.profile}
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                disabled={loading}
                className="px-3 py-2 text-left text-sm font-medium text-gray-700 hover:text-[#EF4444] transition disabled:opacity-50"
              >
                {loading ? t.common.loading : t.nav.logout}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

