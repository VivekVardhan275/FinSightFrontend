
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
  const fetchAttemptedForUserRef = useRef<string | null>(null); // Ref to track fetch per user

  useEffect(() => {
    if (authStatus === 'loading') {
      setIsLoading(true);
      return; 
    }

    if (authStatus === 'authenticated' && user?.email) {
      if (fetchAttemptedForUserRef.current === user.email) {
        // Data already fetched or fetch attempt made for this user, prevent re-fetch.
        // If isLoading is true here, it means the fetch is in progress or .finally() hasn't run.
        // If fetch is complete, isLoading should be false.
        return;
      }

      setIsLoading(true);
      fetchAttemptedForUserRef.current = user.email; 

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
          fetchAttemptedForUserRef.current = null; // Allow retry on error if user session changes or on next load
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (authStatus === 'unauthenticated') {
      if (fetchAttemptedForUserRef.current !== null) { 
        fetchAttemptedForUserRef.current = null; 
      }
      const stored = localStorage.getItem('app-transactions');
      try {
        setTransactions(stored ? JSON.parse(stored) : sampleTransactions);
      } catch (e) {
        console.error("Error parsing transactions from localStorage for unauthenticated user", e);
        setTransactions(sampleTransactions);
      }
      setIsLoading(false);
    }
  }, [user, authStatus]); // Dependencies are user and authStatus.

  useEffect(() => {
    if (!isLoading && (fetchAttemptedForUserRef.current || authStatus === 'unauthenticated')) {
      localStorage.setItem('app-transactions', JSON.stringify(transactions));
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
