'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

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
                Dashboard
              </Link>
              <Link
                href="/transactions"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/transactions')}`}
              >
                Transaksi
              </Link>
              <Link
                href="/reports"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/reports')}`}
              >
                Laporan
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/profile')}`}
            >
              Profil
            </Link>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition disabled:opacity-50"
            >
              {loading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

