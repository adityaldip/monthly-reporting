import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            Monthly Tracker
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-4 font-medium">
            Kelola Keuangan Bulanan Anda dengan Mudah
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Aplikasi modern untuk mencatat pemasukan, pengeluaran, dan mengelola anggaran bulanan Anda. 
            Pantau keuangan Anda dengan lebih efisien dan terorganisir.
          </p>
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Catat Transaksi</h3>
              <p className="text-gray-600 text-sm">
                Catat semua pemasukan dan pengeluaran dengan mudah dan cepat
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kelola Anggaran</h3>
              <p className="text-gray-600 text-sm">
                Buat dan pantau anggaran bulanan untuk setiap kategori pengeluaran
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Laporan & Analisis</h3>
              <p className="text-gray-600 text-sm">
                Lihat laporan keuangan dan analisis pengeluaran Anda secara detail
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-md mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Mulai Kelola Keuangan Anda
            </h2>
            <div className="space-y-4">
              <Link
                href="/register"
                className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold text-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Daftar Sekarang
              </Link>
              <Link
                href="/login"
                className="block w-full bg-white text-blue-600 py-3 px-6 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold text-center border-2 border-blue-600 hover:border-blue-700"
              >
                Masuk ke Akun
              </Link>
            </div>
            <p className="text-sm text-gray-500 text-center mt-6">
              Sudah punya akun? Masuk untuk melanjutkan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
