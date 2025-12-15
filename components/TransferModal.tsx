'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Account } from '@/types/account';
import { Currency } from '@/types/currency';
import { useI18n } from '@/lib/i18n/context';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils/currency';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TransferModal({ isOpen, onClose, onSuccess }: TransferModalProps) {
  const { t, language } = useI18n();
  const [formData, setFormData] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    currency_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      loadCurrencies();
      setFormData({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        currency_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setError('');
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    setLoadingData(true);
    try {
      const response = await fetch('/api/accounts', {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await fetch('/api/currencies', {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setCurrencies(data.currencies || []);
        // Set default currency if available
        const defaultCurrency = data.currencies?.find((c: Currency) => c.is_default);
        if (defaultCurrency) {
          setFormData(prev => ({ ...prev, currency_id: defaultCurrency.id }));
        }
      }
    } catch (err) {
      console.error('Failed to load currencies:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.from_account_id) {
        Swal.fire({
          icon: 'warning',
          title: t.common.warning,
          text: 'Pilih account sumber',
        });
        setError('Pilih account sumber');
        setLoading(false);
        return;
      }

      if (!formData.to_account_id) {
        Swal.fire({
          icon: 'warning',
          title: t.common.warning,
          text: 'Pilih account tujuan',
        });
        setError('Pilih account tujuan');
        setLoading(false);
        return;
      }

      if (formData.from_account_id === formData.to_account_id) {
        Swal.fire({
          icon: 'warning',
          title: t.common.warning,
          text: 'Account sumber dan tujuan tidak boleh sama',
        });
        setError('Account sumber dan tujuan tidak boleh sama');
        setLoading(false);
        return;
      }

      if (!formData.currency_id) {
        Swal.fire({
          icon: 'warning',
          title: t.common.warning,
          text: t.transactionModal.currencyRequired,
        });
        setError(t.transactionModal.currencyRequired);
        setLoading(false);
        return;
      }

      const amount = parseCurrencyInput(formData.amount, language === 'en' ? 'en-US' : 'id-ID');
      if (!amount || amount <= 0) {
        Swal.fire({
          icon: 'warning',
          title: t.common.warning,
          text: 'Amount harus lebih dari 0',
        });
        setError('Amount harus lebih dari 0');
        setLoading(false);
        return;
      }

      // Call transfer API
      const response = await fetch('/api/transactions/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          from_account_id: formData.from_account_id,
          to_account_id: formData.to_account_id,
          amount: amount,
          currency_id: formData.currency_id,
          description: formData.description || undefined,
          date: formData.date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: t.common.error,
          text: data.error || 'Gagal melakukan transfer',
        });
        setError(data.error || 'Gagal melakukan transfer');
        return;
      }

      // Success
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Transfer berhasil dilakukan',
        timer: 2000,
        showConfirmButton: false,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: t.common.error,
        text: 'Gagal melakukan transfer',
      });
      setError('Gagal melakukan transfer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Transfer Antar Akun</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-[#EF4444] px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* From Account */}
              <div>
                <label htmlFor="from_account" className="block text-sm font-medium text-gray-900 mb-1">
                  Dari Akun <span className="text-[#EF4444]">*</span>
                </label>
                {loadingData ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    {t.common.loading}
                  </div>
                ) : (
                  <select
                    id="from_account"
                    value={formData.from_account_id}
                    onChange={(e) => setFormData({ ...formData, from_account_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                  >
                    <option value="">Pilih Akun Sumber</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} {acc.account_number && `(${acc.account_number})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* To Account */}
              <div>
                <label htmlFor="to_account" className="block text-sm font-medium text-gray-900 mb-1">
                  Ke Akun <span className="text-[#EF4444]">*</span>
                </label>
                {loadingData ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    {t.common.loading}
                  </div>
                ) : (
                  <select
                    id="to_account"
                    value={formData.to_account_id}
                    onChange={(e) => setFormData({ ...formData, to_account_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                  >
                    <option value="">Pilih Akun Tujuan</option>
                    {accounts
                      .filter(acc => acc.id !== formData.from_account_id)
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} {acc.account_number && `(${acc.account_number})`}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Amount and Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-900 mb-1">
                    Jumlah <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={(e) => {
                      const locale = language === 'en' ? 'en-US' : 'id-ID';
                      const formatted = formatCurrencyInput(e.target.value, locale);
                      setFormData({ ...formData, amount: formatted });
                    }}
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-900 mb-1">
                    Mata Uang <span className="text-[#EF4444]">*</span>
                  </label>
                  {loadingData ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                      {t.common.loading}
                    </div>
                  ) : (
                    <select
                      id="currency"
                      value={formData.currency_id}
                      onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                    >
                      <option value="">Pilih Mata Uang</option>
                      {currencies.map((curr) => (
                        <option key={curr.id} value={curr.id}>
                          {curr.code} {curr.symbol && `(${curr.symbol})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-900 mb-1">
                  Tanggal <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Tambahkan catatan transfer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                {t.transactionModal.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1E40AF] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Memproses...' : 'Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
