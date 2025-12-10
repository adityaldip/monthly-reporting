import RegisterForm from '@/components/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#10B981] via-[#3B82F6] to-[#2563EB] p-4">
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-md w-full bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#10B981] to-[#2563EB] rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">Buat Akun Baru</h1>
        <p className="text-center text-gray-600 mb-6">Mulai kelola keuangan Anda hari ini</p>
        
        <RegisterForm />
        
        <p className="mt-6 text-center text-sm text-gray-700">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-[#2563EB] hover:text-[#1E40AF] font-semibold hover:underline transition">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

