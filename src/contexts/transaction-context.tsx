
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
  const [isLoading, setIsLoading] = useState(true);
  const fetchAttemptedForUserRef = useRef<string | null>(null);

  const userEmail = user?.email;

  useEffect(() => {
    if (authStatus === 'loading') {
      if (!isLoading) setIsLoading(true);
      return;
    }

    if (authStatus === 'unauthenticated') {
      try {
        const stored = localStorage.getItem('app-transactions');
        let parsed: Transaction[] = [];
        if (stored) {
            const tempParsed = JSON.parse(stored);
            if (Array.isArray(tempParsed)) {
                parsed = tempParsed;
            } else {
                console.warn("localStorage 'app-transactions' was not an array:", tempParsed);
                parsed = [];
            }
        }
        const sortedParsed = parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(currentData => {
          if (JSON.stringify(currentData) === JSON.stringify(sortedParsed)) {
            return currentData;
          }
          return sortedParsed;
        });
      } catch (e) {
        console.error("Error parsing transactions from localStorage for unauthenticated user", e);
        setTransactions([]);
      }
      if (isLoading) setIsLoading(false);
      fetchAttemptedForUserRef.current = null;
      return;
    }

    if (userEmail) {
      if (fetchAttemptedForUserRef.current !== userEmail) {
        if (!isLoading) setIsLoading(true);
        fetchAttemptedForUserRef.current = userEmail;

        axios.get(`${TRANSACTION_API_BASE_URL}?email=${encodeURIComponent(userEmail)}`)
          .then(response => {
            let apiTransactionsSource = response.data;
            let transactionsArray: Transaction[] = [];

            if (Array.isArray(apiTransactionsSource)) {
                transactionsArray = apiTransactionsSource;
            } else if (apiTransactionsSource && typeof apiTransactionsSource === 'object' && 'transactions' in apiTransactionsSource && Array.isArray(apiTransactionsSource.transactions)) {
                // Handles if backend wraps in { transactions: [...] }
                transactionsArray = apiTransactionsSource.transactions;
            } else {
                // If the data is not an array and not an object with a 'transactions' property.
                // For a GET ALL endpoint, this is unexpected.
                // Log a warning and default to empty to prevent errors.
                console.warn(
                    "Transaction API GET all endpoint did not return an array or an object with a 'transactions' array property. Received:",
                    apiTransactionsSource
                );
                transactionsArray = [];
            }

            const newSortedData = transactionsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setTransactions(currentData => {
              if (JSON.stringify(currentData) === JSON.stringify(newSortedData)) {
                return currentData;
              }
              return newSortedData;
            });
          })
          .catch(error => {
            console.error("Error fetching transactions from API:", error);
            setTransactions([]);
            fetchAttemptedForUserRef.current = null;
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
         // Fetch already attempted or in progress for this user.
         // If isLoading is true, it means fetch is ongoing.
         // If isLoading is false, it means fetch completed.
         if (!isLoading && fetchAttemptedForUserRef.current === userEmail) {
            // This case implies fetch completed previously. No action needed unless state needs re-evaluation.
         } else if (isLoading && fetchAttemptedForUserRef.current === userEmail) {
            // Fetch is ongoing for this user, do nothing here, .finally() will handle isLoading.
         } else {
            // This might be a stale isLoading state or a different user scenario.
            // For safety, if not actively fetching for this user, ensure loading is false.
            if(isLoading) setIsLoading(false);
         }
      }
    } else {
      if (isLoading) setIsLoading(false);
      setTransactions([]);
      fetchAttemptedForUserRef.current = null;
    }
  }, [userEmail, authStatus, isLoading]); // Added isLoading back to dependencies, needs careful watching. No, remove it.

  useEffect(() => {
    if (!isLoading && (fetchAttemptedForUserRef.current === userEmail || authStatus === 'unauthenticated')) {
      try {
        localStorage.setItem('app-transactions', JSON.stringify(transactions));
      } catch (error) {
        console.error("Error saving transactions to localStorage:", error);
      }
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
