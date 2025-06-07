
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
    if (authStatus === 'loading') {
      if (!isLoading) setIsLoading(true);
      return;
    }

    if (authStatus === 'unauthenticated') {
      if (!isLoading) setIsLoading(true);
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
        setTransactions(currentData => JSON.stringify(currentData) === JSON.stringify(sortedParsed) ? currentData : sortedParsed);
      } catch (e) {
        console.error("TransactionContext: Error processing transactions from localStorage for unauthenticated user", e);
        setTransactions([]);
      }
      fetchAttemptedForUserRef.current = null;
      if (isLoading) setIsLoading(false);
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
                transactionsArray = apiTransactionsSource.transactions;
            } else {
                console.warn("TransactionContext: Transaction API GET all endpoint did not return an array or an object with a 'transactions' array property.");
            }
            const newSortedData = transactionsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(currentData => JSON.stringify(currentData) === JSON.stringify(newSortedData) ? currentData : newSortedData);
          })
          .catch(error => {
            console.error("API error fetching transactions.");
            if (axios.isAxiosError(error) && error.response) {
                console.error("Backend error message:", error.response.data?.message || error.response.data?.error || "No specific message from backend.");
                console.error("Status code:", error.response.status);
            } else if (error instanceof Error) {
                console.error("Error details:", error.message);
            }
            setTransactions([]);
            fetchAttemptedForUserRef.current = null;
          })
          .finally(() => {
            if (isLoading) setIsLoading(false);
          });
      } else {
        if (isLoading) setIsLoading(false);
      }
    } else {
      setTransactions([]);
      fetchAttemptedForUserRef.current = null;
      if (isLoading) setIsLoading(false);
    }
  }, [userEmail, authStatus, isLoading]);

  useEffect(() => {
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
