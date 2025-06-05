
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Currency = "USD" | "EUR" | "GBP" | "INR";

// Rates represent: 1 INR = X units of this currency
// Example: If 1 USD = 83 INR, then 1 INR = 1/83 USD.
export interface ConversionRates {
  INR: number; // Base
  USD: number;
  EUR: number;
  GBP: number;
  [key: string]: number;
}

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  conversionRates: ConversionRates;
  /**
   * Converts an amount from INR to the specified target currency.
   * @param amountInINR The amount in INR.
   * @param toCurrency The target currency to convert to. Defaults to the globally selected currency.
   * @returns The converted amount in the target currency.
   */
  convertAmount: (amountInINR: number, toCurrency?: Currency) => number;
}

// Define base rates against INR. Adjust these as per actual desired fixed rates.
// For example, if you want to peg:
// 1 USD = 83 INR
// 1 EUR = 76.36 INR (derived from 0.92 EUR/USD * 83 INR/USD)
// 1 GBP = 65.57 INR (derived from 0.79 GBP/USD * 83 INR/USD)
// Then the rates for the object (1 INR = X of other currency) are:
const placeholderConversionRates: ConversionRates = {
  INR: 1,
  USD: 1 / 83,      // Approximately 0.012048
  EUR: 1 / 76.36,   // Approximately 0.013096
  GBP: 1 / 65.57,   // Approximately 0.015251
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCurrencyState, setSelectedCurrencyState] = useState<Currency>("INR");

  useEffect(() => {
    const storedCurrency = localStorage.getItem("app-currency") as Currency | null;
    if (storedCurrency && placeholderConversionRates[storedCurrency]) {
      setSelectedCurrencyState(storedCurrency);
    } else {
      setSelectedCurrencyState("INR");
      localStorage.setItem("app-currency", "INR");
    }
  }, []);

  const setSelectedCurrency = useCallback((currency: Currency) => {
    if (placeholderConversionRates[currency]) {
      setSelectedCurrencyState(currency);
      localStorage.setItem("app-currency", currency);
    }
  }, []);

  const convertAmount = useCallback((amountInINR: number, toCurrency: Currency = selectedCurrencyState): number => {
    const rate = placeholderConversionRates[toCurrency] || 1; // Fallback to 1 if currency not found (should not happen)
    return amountInINR * rate;
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

