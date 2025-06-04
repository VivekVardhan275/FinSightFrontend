
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Currency = "USD" | "EUR" | "GBP";

export interface ConversionRates {
  USD: number; // Base
  EUR: number;
  GBP: number;
  [key: string]: number; // Allow for more currencies if needed
}

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  conversionRates: ConversionRates;
  convertAmount: (amountInUsd: number, toCurrency?: Currency) => number;
}

const placeholderConversionRates: ConversionRates = {
  USD: 1,
  EUR: 0.92, // 1 USD = 0.92 EUR
  GBP: 0.79, // 1 USD = 0.79 GBP
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCurrencyState, setSelectedCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const storedCurrency = localStorage.getItem("app-currency") as Currency | null;
    if (storedCurrency && placeholderConversionRates[storedCurrency]) {
      setSelectedCurrencyState(storedCurrency);
    } else {
      // If not stored or invalid, default to USD and save it
      setSelectedCurrencyState("USD");
      localStorage.setItem("app-currency", "USD");
    }
  }, []);

  const setSelectedCurrency = useCallback((currency: Currency) => {
    if (placeholderConversionRates[currency]) {
      setSelectedCurrencyState(currency);
      localStorage.setItem("app-currency", currency);
    }
  }, []);

  const convertAmount = useCallback((amountInUsd: number, toCurrency: Currency = selectedCurrencyState): number => {
    const rate = placeholderConversionRates[toCurrency] || 1;
    return amountInUsd * rate;
  }, [selectedCurrencyState]);

  return (
    <CurrencyContext.Provider value={{ selectedCurrency: selectedCurrencyState, setSelectedCurrency, conversionRates: placeholderConversionRates, convertAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
