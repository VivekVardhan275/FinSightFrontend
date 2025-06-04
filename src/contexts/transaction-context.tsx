
"use client";

import type { Transaction } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { sampleTransactions } from '@/lib/placeholder-data';
import { v4 as uuidv4 } from 'uuid';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transactionData: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (transactionData: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  getTransactionsByMonth: (year: number, month: number) => Transaction[];
  getTransactionsByCategoryAndMonth: (category: string, year: number, month: number) => Transaction[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const storedTransactions = localStorage.getItem('app-transactions');
    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch (e) {
        console.error("Error parsing transactions from localStorage", e);
        setTransactions(sampleTransactions); // Fallback to sample data
      }
    } else {
      setTransactions(sampleTransactions);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app-transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = useCallback((transactionData: Omit<Transaction, 'id'>): Transaction => {
    const newTransaction: Transaction = { ...transactionData, id: uuidv4() };
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  }, []);

  const updateTransaction = useCallback((transactionData: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === transactionData.id ? transactionData : t));
  }, []);

  const deleteTransaction = useCallback((transactionId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  }, []);

  const getTransactionsByMonth = useCallback((year: number, month: number): Transaction[] => {
    // Month is 0-indexed for Date, but typically 1-indexed in usage. Assuming month is 1-indexed.
    const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    return transactions.filter(t => t.date.startsWith(targetMonthStr));
  }, [transactions]);

  const getTransactionsByCategoryAndMonth = useCallback((category: string, year: number, month: number): Transaction[] => {
    const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    return transactions.filter(t => t.category === category && t.date.startsWith(targetMonthStr) && t.type === 'expense');
  }, [transactions]);


  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, updateTransaction, deleteTransaction, getTransactionsByMonth, getTransactionsByCategoryAndMonth }}>
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
