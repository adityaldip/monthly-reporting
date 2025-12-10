import RegisterForm from '@/components/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Daftar</h1>
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-gray-800">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

