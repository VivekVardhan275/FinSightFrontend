
"use client";

import type { Transaction } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { sampleTransactions } from '@/lib/placeholder-data';
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

  useEffect(() => {
    if (authStatus === 'loading') {
      setIsLoading(true); // Ensure loading is true while auth is resolving
      return;
    }

    if (authStatus === 'authenticated' && user?.email) {
      // Only fetch if it hasn't been attempted for the current user.email
      if (fetchAttemptedForUserRef.current !== user.email) {
        setIsLoading(true);
        fetchAttemptedForUserRef.current = user.email; // Mark that fetch is being attempted for this user

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
            fetchAttemptedForUserRef.current = null; // Allow retry on error for this user
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Fetch already attempted for this user. If it was successful, data is loaded.
        // If it failed, fetchAttemptedForUserRef was reset, and it might retry if user object changes.
        // Ensure isLoading is false if not actively fetching (which the above block would handle).
        if(isLoading && !axios.interceptors.request.handlers.some(handler => handler.fulfilled?.toString().includes(TRANSACTION_API_BASE_URL))) {
             // This check for active axios request is a bit hacky, ideally not needed if logic is perfect.
             // The main idea is: if fetch was attempted and we are not in the process of fetching, isLoading should be false.
             // The finally() block of the fetch handles this for the current fetch.
        }
      }
    } else if (authStatus === 'unauthenticated') {
      fetchAttemptedForUserRef.current = null; // Reset fetch attempt on logout
      const stored = localStorage.getItem('app-transactions');
      try {
        setTransactions(stored ? JSON.parse(stored) : sampleTransactions);
      } catch (e) {
        console.error("Error parsing transactions from localStorage for unauthenticated user", e);
        setTransactions(sampleTransactions);
      }
      setIsLoading(false); // Done loading for unauthenticated state
    }
  }, [user, authStatus]); // Dependencies are user and authStatus

  useEffect(() => {
    // Save to localStorage only when not loading and data fetch has been settled for the current state (either successful or unauth)
    if (!isLoading && (fetchAttemptedForUserRef.current === user?.email || authStatus === 'unauthenticated')) {
      localStorage.setItem('app-transactions', JSON.stringify(transactions));
    }
  }, [transactions, isLoading, user, authStatus]);

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
