'use client';

import Navbar from '@/components/Navbar';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Laporan</h1>
          <p className="mt-2 text-gray-600">Analisis keuangan bulanan Anda</p>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Halaman laporan akan segera tersedia
        </div>
      </main>
    </div>
  );
}

