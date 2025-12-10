'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import TransactionModal from '@/components/TransactionModal';

export default function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'outcome' | undefined>(undefined);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaksi</h1>
            <p className="mt-2 text-gray-600">Kelola pemasukan dan pengeluaran Anda</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setModalType('income');
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm sm:text-base"
            >
              + Pemasukan
            </button>
            <button
              onClick={() => {
                setModalType('outcome');
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm sm:text-base"
            >
              + Pengeluaran
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Halaman transaksi akan segera tersedia
        </div>
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalType(undefined);
        }}
        type={modalType}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}

