'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  currencies: any[];
  setCurrencies: (currencies: any[]) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>('');
  const [currencies, setCurrencies] = useState<any[]>([]);

  useEffect(() => {
    // Load saved currency preference from localStorage
    const savedCurrency = localStorage.getItem('displayCurrency');
    if (savedCurrency) {
      setSelectedCurrencyState(savedCurrency);
    }
  }, []);

  useEffect(() => {
    // Load currencies
    const loadCurrencies = async () => {
      try {
        const response = await fetch('/api/currencies', {
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) {
          setCurrencies(data.currencies || []);
          
          // If no saved currency, use default currency
          const savedCurrency = localStorage.getItem('displayCurrency');
          if (!savedCurrency && data.currencies && data.currencies.length > 0) {
            const defaultCurrency = data.currencies.find((c: any) => c.is_default);
            const currencyToUse = defaultCurrency?.code || data.currencies[0]?.code || '';
            setSelectedCurrencyState(currencyToUse);
            localStorage.setItem('displayCurrency', currencyToUse);
          } else if (savedCurrency && data.currencies && data.currencies.length > 0) {
            // Verify saved currency exists
            const currencyExists = data.currencies.some((c: any) => c.code === savedCurrency);
            if (!currencyExists) {
              // If saved currency doesn't exist, use default or first
              const defaultCurrency = data.currencies.find((c: any) => c.is_default);
              const currencyToUse = defaultCurrency?.code || data.currencies[0]?.code || '';
              setSelectedCurrencyState(currencyToUse);
              localStorage.setItem('displayCurrency', currencyToUse);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load currencies:', err);
      }
    };

    loadCurrencies();
  }, []);

  const setSelectedCurrency = (currency: string) => {
    setSelectedCurrencyState(currency);
    localStorage.setItem('displayCurrency', currency);
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, currencies, setCurrencies }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
