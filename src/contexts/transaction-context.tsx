
"use client";

import type { Transaction } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { sampleTransactions } from '@/lib/placeholder-data';
import axios from 'axios'; // Import axios
import { useAuthState } from '@/hooks/use-auth-state'; // Import useAuthState

const TRANSACTION_API_BASE_URL = "http://localhost:8080/api/user/transactions";

interface TransactionContextType {
  transactions: Transaction[];
  isLoading: boolean; // Added isLoading state
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transactionData: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  getTransactionsByMonth: (year: number, month: number) => Transaction[];
  getTransactionsByCategoryAndMonth: (category: string, year: number, month: number) => Transaction[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user, status: authStatus } = useAuthState(); // Get user and auth status
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [hasAttemptedApiFetch, setHasAttemptedApiFetch] = useState(false);

  useEffect(() => {
    if (authStatus === 'authenticated' && user?.email && !hasAttemptedApiFetch) {
      setIsLoading(true);
      setHasAttemptedApiFetch(true); // Mark that we are attempting now

      axios.get(`${TRANSACTION_API_BASE_URL}?email=${encodeURIComponent(user.email)}`)
        .then(response => {
          if (Array.isArray(response.data)) {
            setTransactions(response.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          } else {
            console.warn("API did not return an array for transactions, falling back to localStorage.");
            const stored = localStorage.getItem('app-transactions');
            setTransactions(stored ? JSON.parse(stored) : sampleTransactions);
          }
        })
        .catch(error => {
          console.error("Error fetching transactions from API, falling back to localStorage:", error);
          const stored = localStorage.getItem('app-transactions');
          try {
            setTransactions(stored ? JSON.parse(stored) : sampleTransactions);
          } catch (e) {
            console.error("Error parsing transactions from localStorage during fallback", e);
            setTransactions(sampleTransactions);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (authStatus === 'unauthenticated' && !hasAttemptedApiFetch && !isLoading) {
      // If unauthenticated and we haven't tried an API fetch (which requires email)
      // and not already loading something else.
      const stored = localStorage.getItem('app-transactions');
      try {
        setTransactions(stored ? JSON.parse(stored) : sampleTransactions);
      } catch (e) {
        console.error("Error parsing transactions from localStorage for unauthenticated user", e);
        setTransactions(sampleTransactions);
      }
      setIsLoading(false);
    } else if (authStatus === 'loading') {
      // Still loading auth status, ensure isLoading remains true or is set to true
      if (!isLoading) setIsLoading(true);
    } else if (hasAttemptedApiFetch && authStatus !== 'loading' && isLoading) {
      // If API fetch was attempted, and auth status is resolved (and not loading)
      // ensure isLoading is false.
      setIsLoading(false);
    } else if (!user?.email && authStatus === 'authenticated' && !hasAttemptedApiFetch && !isLoading) {
      // Case where user is authenticated but email might not be available yet, and we haven't fetched.
      // This case might be covered by 'loading' or the primary fetch block.
      // If it reaches here, it implies we should probably load from localStorage as a temporary measure.
       const stored = localStorage.getItem('app-transactions');
        try {
            setTransactions(stored ? JSON.parse(stored) : sampleTransactions);
        } catch (e) {
            setTransactions(sampleTransactions);
        }
        setIsLoading(false);
    }


  }, [user, authStatus, hasAttemptedApiFetch, isLoading]);

  useEffect(() => {
    // Persist to localStorage whenever transactions change, but only if not in initial load phase.
    // This check prevents writing sample/empty data over potentially good localStorage data
    // before API fetch or initial localStorage load completes.
    if (!isLoading && hasAttemptedApiFetch) { // Or a more robust check like `isInitialLoadComplete`
      localStorage.setItem('app-transactions', JSON.stringify(transactions));
    } else if (authStatus === 'unauthenticated' && !isLoading) {
      // Allow saving to localStorage if user is not logged in (e.g. working offline after logout)
      localStorage.setItem('app-transactions', JSON.stringify(transactions));
    }
  }, [transactions, isLoading, hasAttemptedApiFetch, authStatus]);

  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const updateTransaction = useCallback((transactionData: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === transactionData.id ? transactionData : t).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const deleteTransaction = useCallback((transactionId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  }, []);

  const getTransactionsByMonth = useCallback((year: number, month: number): Transaction[] => {
    const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    return transactions.filter(t => t.date.startsWith(targetMonthStr));
  }, [transactions]);

  const getTransactionsByCategoryAndMonth = useCallback((category: string, year: number, month: number): Transaction[] => {
    const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    const lowerCaseCategory = category.toLowerCase();
    return transactions.filter(t =>
      t.category.toLowerCase() === lowerCaseCategory &&
      t.date.startsWith(targetMonthStr) &&
      t.type === 'expense'
    );
  }, [transactions]);

  return (
    <TransactionContext.Provider value={{ transactions, isLoading, addTransaction, updateTransaction, deleteTransaction, getTransactionsByMonth, getTransactionsByCategoryAndMonth }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactionContext must be used within a TransactionProvider');
  }
  return context;
};
