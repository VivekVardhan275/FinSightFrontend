
"use client";

import type { Transaction } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
// import { sampleTransactions } from '@/lib/placeholder-data'; // No longer using sampleTransactions as primary fallback
import axios from 'axios';
import { useAuthState } from '@/hooks/use-auth-state';

const TRANSACTION_API_BASE_URL = "http://localhost:8080/api/user/transactions";

interface TransactionContextType {
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transactionData: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  getTransactionsByMonth: (year: number, month: number) => Transaction[];
  getTransactionsByCategoryAndMonth: (category: string, year: number, month: number) => Transaction[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user, status: authStatus } = useAuthState();
  const [isLoading, setIsLoading] = useState(true);
  const fetchAttemptedForUserRef = useRef<string | null>(null);

  const userEmail = user?.email; // Stable variable for user's email

  useEffect(() => {
    if (authStatus === 'loading') {
      // Still waiting for auth to resolve, ensure isLoading is true if not already.
      if (!isLoading) setIsLoading(true);
      return;
    }

    if (authStatus === 'authenticated' && userEmail) {
      if (fetchAttemptedForUserRef.current !== userEmail) {
        setIsLoading(true);
        fetchAttemptedForUserRef.current = userEmail;

        axios.get(`${TRANSACTION_API_BASE_URL}?email=${encodeURIComponent(userEmail)}`)
          .then(response => {
            const apiData = response.data;
            if (Array.isArray(apiData)) {
              const newSortedData = apiData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              setTransactions(currentData => {
                if (JSON.stringify(currentData) === JSON.stringify(newSortedData)) {
                  return currentData;
                }
                return newSortedData;
              });
            } else {
              console.warn("API did not return an array for transactions, defaulting to empty.");
              setTransactions([]);
            }
          })
          .catch(error => {
            console.error("Error fetching transactions from API, defaulting to empty:", error);
            setTransactions([]);
            fetchAttemptedForUserRef.current = null; // Allow retry on error
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Fetch already attempted for this userEmail. If isLoading is true, it means an earlier stage
        // might have set it, and now auth is resolved, so we can set it to false.
        if (isLoading) setIsLoading(false);
      }
    } else if (authStatus === 'unauthenticated') {
      const stored = localStorage.getItem('app-transactions');
      try {
        const parsed = stored ? JSON.parse(stored) : []; // Default to empty array
         setTransactions(currentData => JSON.stringify(currentData) === JSON.stringify(parsed) ? currentData : parsed);
      } catch (e) {
        console.error("Error parsing transactions from localStorage for unauthenticated user", e);
        setTransactions([]);
      }
      if (isLoading) setIsLoading(false);
      fetchAttemptedForUserRef.current = null;
    }
  }, [userEmail, authStatus]); // isLoading is intentionally omitted to prevent loops

  useEffect(() => {
    if (!isLoading && (fetchAttemptedForUserRef.current === userEmail || authStatus === 'unauthenticated')) {
      localStorage.setItem('app-transactions', JSON.stringify(transactions));
    }
  }, [transactions, isLoading, userEmail, authStatus]);

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
