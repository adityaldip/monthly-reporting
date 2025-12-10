import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Monthly Tracker</h1>
        <p className="text-gray-800 mb-8">
          Aplikasi untuk mencatat pemasukan dan pengeluaran bulanan
        </p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
          >
            Daftar
          </Link>
        </div>
      </div>
    </div>
  );
}
