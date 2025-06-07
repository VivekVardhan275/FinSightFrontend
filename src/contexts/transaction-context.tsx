
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
  const [contextIsLoading, setContextIsLoading] = useState(true);
  const fetchAttemptedForUserRef = useRef<string | null>(null);

  const userEmail = user?.email;

  useEffect(() => {
    if (authStatus === 'loading') {
      if (!contextIsLoading) setContextIsLoading(true);
      return;
    }

    if (authStatus === 'unauthenticated') {
      if (!contextIsLoading) setContextIsLoading(true);
      try {
        const stored = localStorage.getItem('app-transactions');
        let parsed: Transaction[] = [];
        if (stored) {
          const tempParsed = JSON.parse(stored);
          if (Array.isArray(tempParsed)) {
            parsed = tempParsed;
          } else {
            console.warn("TransactionContext (unauth): localStorage 'app-transactions' was not an array:", tempParsed);
          }
        }
        const sortedParsed = parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(currentData => JSON.stringify(currentData) === JSON.stringify(sortedParsed) ? currentData : sortedParsed);
      } catch (e) {
        console.error("TransactionContext (unauth): Error processing transactions from localStorage", e);
        setTransactions([]);
      }
      fetchAttemptedForUserRef.current = null;
      setContextIsLoading(false);
      return;
    }

    if (userEmail) {
      if (fetchAttemptedForUserRef.current !== userEmail) {
        if (!contextIsLoading) setContextIsLoading(true);
        fetchAttemptedForUserRef.current = userEmail; // Mark as attempted for this user

        axios.get(`${TRANSACTION_API_BASE_URL}?email=${encodeURIComponent(userEmail)}`)
          .then(response => {
            let apiTransactionsSource = response.data;
            let transactionsArray: Transaction[] = [];

            if (Array.isArray(apiTransactionsSource)) {
              transactionsArray = apiTransactionsSource;
            } else if (apiTransactionsSource && typeof apiTransactionsSource === 'object' && 'transactions' in apiTransactionsSource && Array.isArray(apiTransactionsSource.transactions)) {
              transactionsArray = apiTransactionsSource.transactions;
            } else {
              console.warn("TransactionContext (auth): API response did not contain an array or a 'transactions' array property.");
            }
            const newSortedData = transactionsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(currentData => JSON.stringify(currentData) === JSON.stringify(newSortedData) ? currentData : newSortedData);
          })
          .catch(error => {
            console.error("TransactionContext (auth): API error fetching transactions.");
            if (axios.isAxiosError(error) && error.response) {
              console.error("Backend error message:", error.response.data?.message || error.response.data?.error || "No specific message from backend.");
              console.error("Status code:", error.response.status);
              // If it's a 404, we assume no data and don't reset the ref to prevent retries for this user.
              // For other errors, reset to allow a retry.
              if (error.response.status !== 404) {
                fetchAttemptedForUserRef.current = null;
              }
            } else if (error instanceof Error) {
              console.error("Error details:", error.message);
               fetchAttemptedForUserRef.current = null; // Reset for non-Axios errors too
            } else {
               fetchAttemptedForUserRef.current = null; // Reset for unknown errors
            }
            setTransactions([]); // Set to empty on error
          })
          .finally(() => {
            setContextIsLoading(false);
          });
      } else {
        // Data already fetched (or fetch attempt completed) for this user.
        if (contextIsLoading) setContextIsLoading(false);
      }
    } else {
      setTransactions([]);
      fetchAttemptedForUserRef.current = null;
      if (contextIsLoading) setContextIsLoading(false);
    }
  }, [userEmail, authStatus, contextIsLoading]);

  useEffect(() => {
    if (authStatus === 'unauthenticated' && !contextIsLoading) {
      try {
        localStorage.setItem('app-transactions', JSON.stringify(transactions));
      } catch (error) {
        console.error("TransactionContext (unauth): Error saving transactions to localStorage:", error);
      }
    }
  }, [transactions, contextIsLoading, authStatus]);

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
    <TransactionContext.Provider value={{ transactions, isLoading: contextIsLoading, addTransaction, updateTransaction, deleteTransaction, getTransactionsByMonth, getTransactionsByCategoryAndMonth }}>
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
