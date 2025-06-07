
"use client";

import type { Transaction } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import axios from 'axios';
import { useAuthState } from '@/hooks/use-auth-state';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const TRANSACTION_API_BASE_URL = `${backendUrl}/api/user/transactions`;

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
  const [isLoading, setIsLoading] = useState(true); // Initialize to true
  const fetchAttemptedForUserRef = useRef<string | null>(null);

  const userEmail = user?.email;

  useEffect(() => {
    // Effect for fetching transactions based on auth state
    if (authStatus === 'loading') {
      if (!isLoading) setIsLoading(true); // Ensure loading state if auth is resolving
      return;
    }

    if (authStatus === 'unauthenticated') {
      if (!isLoading) setIsLoading(true); // Indicate loading for localStorage access
      try {
        const stored = localStorage.getItem('app-transactions');
        let parsed: Transaction[] = [];
        if (stored) {
            const tempParsed = JSON.parse(stored);
            if (Array.isArray(tempParsed)) {
                parsed = tempParsed;
            } else {
                console.warn("TransactionContext: localStorage 'app-transactions' was not an array:", tempParsed);
            }
        }
        const sortedParsed = parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        // Only update state if data is different to avoid unnecessary re-renders
        setTransactions(currentData => {
          if (JSON.stringify(currentData) === JSON.stringify(sortedParsed)) return currentData;
          return sortedParsed;
        });
      } catch (e) {
        console.error("TransactionContext: Error processing transactions from localStorage for unauthenticated user", e);
        setTransactions([]); // Default to empty on error
      }
      fetchAttemptedForUserRef.current = null; // Reset for next potential login
      if (isLoading) setIsLoading(false); // Done with unauthenticated state
      return;
    }

    // authStatus === 'authenticated'
    if (userEmail) {
      if (fetchAttemptedForUserRef.current !== userEmail) {
        // New user or first fetch attempt for this user
        if (!isLoading) setIsLoading(true);
        fetchAttemptedForUserRef.current = userEmail; // Mark that we ARE ATTEMPTING for this user

        axios.get(`${TRANSACTION_API_BASE_URL}?email=${encodeURIComponent(userEmail)}`)
          .then(response => {
            let apiTransactionsSource = response.data;
            let transactionsArray: Transaction[] = [];

            if (Array.isArray(apiTransactionsSource)) {
                transactionsArray = apiTransactionsSource;
            } else if (apiTransactionsSource && typeof apiTransactionsSource === 'object' && 'transactions' in apiTransactionsSource && Array.isArray(apiTransactionsSource.transactions)) {
                transactionsArray = apiTransactionsSource.transactions;
            } else {
                console.warn(
                    "TransactionContext: Transaction API GET all endpoint did not return an array or an object with a 'transactions' array property. Received:",
                    apiTransactionsSource
                );
            }
            const newSortedData = transactionsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            // Only update state if data is different
            setTransactions(currentData => {
              if (JSON.stringify(currentData) === JSON.stringify(newSortedData)) return currentData;
              return newSortedData;
            });
          })
          .catch(error => {
            console.error("TransactionContext: Error fetching transactions from API:", error);
            setTransactions([]); // Default to empty on API error
            fetchAttemptedForUserRef.current = null; // IMPORTANT: Allow retry on error
          })
          .finally(() => {
            if (isLoading) setIsLoading(false); // Fetch attempt finished
          });
      } else {
        // Fetch was already attempted for this user (ref matches userEmail).
        // If we're not currently loading, ensure isLoading is false.
        // This handles cases where the effect re-runs but a fetch isn't needed.
        if (isLoading) setIsLoading(false);
      }
    } else {
      // Authenticated, but no userEmail (should be rare)
      setTransactions([]);
      fetchAttemptedForUserRef.current = null;
      if (isLoading) setIsLoading(false);
    }
  }, [userEmail, authStatus, isLoading]); // isLoading is included to allow effect to re-evaluate if isLoading was externally set to true.

  useEffect(() => {
    // Effect for saving transactions to localStorage
    if (authStatus === 'unauthenticated' && !isLoading) {
      try {
        localStorage.setItem('app-transactions', JSON.stringify(transactions));
      } catch (error) {
        console.error("TransactionContext: Error saving transactions to localStorage:", error);
      }
    }
  }, [transactions, isLoading, authStatus]);

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

