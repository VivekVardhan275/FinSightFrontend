
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
      if(!isLoading) setIsLoading(true); // Ensure loading is true while auth resolves
      return;
    }

    if (authStatus === 'authenticated' && userEmail) {
      if (fetchAttemptedForUserRef.current !== userEmail) {
        setIsLoading(true);
        fetchAttemptedForUserRef.current = userEmail;

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
            fetchAttemptedForUserRef.current = null; // Allow retry on error
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
         // Data already fetched or fetch attempt made for this user, ensure loading is false
         if (isLoading) setIsLoading(false);
      }
    } else if (authStatus === 'unauthenticated') {
      const stored = localStorage.getItem('app-transactions');
      let parsed: Transaction[] = [];
      try {
        parsed = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error("Error parsing transactions from localStorage for unauthenticated user", e);
        parsed = [];
      }
      setTransactions(currentData => JSON.stringify(currentData) === JSON.stringify(parsed) ? currentData : parsed);
      if (isLoading) setIsLoading(false);
      fetchAttemptedForUserRef.current = null;
    }
  // Removed isLoading from dependency array
  }, [userEmail, authStatus]); 

  useEffect(() => {
    // Save to localStorage only when not loading, and fetch has been attempted for the current user (or unauthenticated)
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
