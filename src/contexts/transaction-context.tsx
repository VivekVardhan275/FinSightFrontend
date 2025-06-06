
"use client";

import type { Transaction } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
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

  const userEmail = user?.email;

  useEffect(() => {
    if (authStatus === 'loading') {
      if (!isLoading) setIsLoading(true);
      return; // Early exit if auth is still loading
    }

    if (authStatus === 'unauthenticated') {
      const stored = localStorage.getItem('app-transactions');
      let parsed: Transaction[] = [];
      try {
        parsed = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error("Error parsing transactions from localStorage for unauthenticated user", e);
        // Keep parsed as empty array
      }
      // Only update if different to prevent potential loops if localStorage parsing is unstable
      setTransactions(currentData => {
        if (JSON.stringify(currentData) === JSON.stringify(parsed)) {
          return currentData;
        }
        return parsed;
      });
      if (isLoading) setIsLoading(false);
      fetchAttemptedForUserRef.current = null; // Reset fetch attempt flag
      return; // Early exit
    }

    // At this point, authStatus === 'authenticated'
    if (userEmail) {
      if (fetchAttemptedForUserRef.current !== userEmail) {
        // Need to fetch for this user
        if (!isLoading) setIsLoading(true); // Set loading before initiating fetch
        fetchAttemptedForUserRef.current = userEmail; // Mark fetch as attempted for this user

        axios.get(`${TRANSACTION_API_BASE_URL}?email=${encodeURIComponent(userEmail)}`)
          .then(response => {
            const apiData = response.data;
            const newSortedData = Array.isArray(apiData)
              ? apiData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              : [];
            
            setTransactions(currentData => {
              if (JSON.stringify(currentData) === JSON.stringify(newSortedData)) {
                return currentData;
              }
              return newSortedData;
            });
          })
          .catch(error => {
            console.error("Error fetching transactions from API:", error);
            setTransactions([]); // Default to empty on error
            fetchAttemptedForUserRef.current = null; // Allow retry on error for this user
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Fetch already attempted or in progress for this user.
        // If isLoading is true, it means a fetch is ongoing, .finally() will set it to false.
        // If isLoading is false, it means fetch completed.
        // This branch might imply that isLoading should be false if not actively fetching.
        if (isLoading) {
             // This case should ideally be handled by the .finally() of an active fetch.
             // If we reach here and isLoading is true, but no fetch is active for *this current userEmail*,
             // it's a sign that isLoading might be stuck. However, the primary control is the fetch block.
             // For safety, if fetchAttemptedForUserRef.current === userEmail (meaning not actively starting a NEW fetch)
             // and isLoading is true, it might be stale from a previous state.
             // However, to avoid race conditions, it's safer to let .finally() handle it.
             // If no fetch is active, isLoading should eventually become false.
        }
      }
    } else {
      // Authenticated, but no userEmail (e.g., session issue or partial user object)
      if (isLoading) setIsLoading(false);
      setTransactions([]); // No user context, clear transactions
      fetchAttemptedForUserRef.current = null; // Reset fetch attempt flag
    }
  }, [userEmail, authStatus]); // isLoading is intentionally omitted

  useEffect(() => {
    // Save to localStorage only when not loading, AND fetch has been attempted/resolved for current user OR user is unauthenticated
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
