
"use client";

import type { Budget, Transaction } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { sampleBudgets } from '@/lib/placeholder-data';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { useAuthState } from '@/hooks/use-auth-state';

const BUDGET_API_BASE_URL = "http://localhost:8080/api/user/budgets";

interface BudgetContextType {
  budgets: Budget[];
  isLoading: boolean;
  addBudget: (budget: Budget) => Budget; // Expects a full budget object
  updateBudget: (budgetData: Budget) => void;
  deleteBudget: (budgetId: string) => void;
  getBudgetById: (budgetId: string) => Budget | undefined;
  updateBudgetSpentAmount: (budgetId: string, transactions: Transaction[]) => void;
  getBudgetsByMonth: (year: number, month: number) => Budget[];
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const { user, status: authStatus } = useAuthState();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedApiFetch, setHasAttemptedApiFetch] = useState(false);

  useEffect(() => {
    if (authStatus === 'authenticated' && user?.email && !hasAttemptedApiFetch) {
      setIsLoading(true);
      setHasAttemptedApiFetch(true);

      axios.get(`${BUDGET_API_BASE_URL}?email=${encodeURIComponent(user.email)}`)
        .then(response => {
          if (Array.isArray(response.data)) {
            setBudgets(response.data.sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)));
          } else {
            console.warn("API did not return an array for budgets, falling back to localStorage.");
            const stored = localStorage.getItem('app-budgets');
            setBudgets(stored ? JSON.parse(stored) : sampleBudgets);
          }
        })
        .catch(error => {
          console.error("Error fetching budgets from API, falling back to localStorage:", error);
          const stored = localStorage.getItem('app-budgets');
          try {
            setBudgets(stored ? JSON.parse(stored) : sampleBudgets);
          } catch (e) {
            console.error("Error parsing budgets from localStorage during fallback", e);
            setBudgets(sampleBudgets);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (authStatus === 'unauthenticated' && !hasAttemptedApiFetch && !isLoading) {
      const stored = localStorage.getItem('app-budgets');
      try {
        setBudgets(stored ? JSON.parse(stored) : sampleBudgets);
      } catch (e) {
        setBudgets(sampleBudgets);
      }
      setIsLoading(false);
    } else if (authStatus === 'loading') {
      if (!isLoading) setIsLoading(true);
    } else if (hasAttemptedApiFetch && authStatus !== 'loading' && isLoading) {
      setIsLoading(false);
    } else if (!user?.email && authStatus === 'authenticated' && !hasAttemptedApiFetch && !isLoading) {
       const stored = localStorage.getItem('app-budgets');
        try {
            setBudgets(stored ? JSON.parse(stored) : sampleBudgets);
        } catch (e) {
            setBudgets(sampleBudgets);
        }
        setIsLoading(false);
    }
  }, [user, authStatus, hasAttemptedApiFetch, isLoading]);

  useEffect(() => {
    if (!isLoading && hasAttemptedApiFetch) {
      localStorage.setItem('app-budgets', JSON.stringify(budgets));
    } else if (authStatus === 'unauthenticated' && !isLoading) {
      localStorage.setItem('app-budgets', JSON.stringify(budgets));
    }
  }, [budgets, isLoading, hasAttemptedApiFetch, authStatus]);

  const addBudget = useCallback((newBudget: Budget): Budget => {
    setBudgets(prev => [newBudget, ...prev].sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)));
    return newBudget;
  }, []);

  const updateBudget = useCallback((budgetData: Budget) => {
    setBudgets(prev => prev.map(b => b.id === budgetData.id ? budgetData : b).sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)));
  }, []);

  const deleteBudget = useCallback((budgetId: string) => {
    setBudgets(prev => prev.filter(b => b.id !== budgetId));
  }, []);

  const getBudgetById = useCallback((budgetId: string) => {
    return budgets.find(b => b.id === budgetId);
  }, [budgets]);

  const getBudgetsByMonth = useCallback((year: number, month: number): Budget[] => {
    const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    return budgets.filter(b => b.month === targetMonthStr);
  }, [budgets]);

  const updateBudgetSpentAmount = useCallback((budgetId: string, relatedTransactions: Transaction[]) => {
    setBudgets(prevBudgets => {
      const targetBudgetIndex = prevBudgets.findIndex(b => b.id === budgetId);
      if (targetBudgetIndex === -1) return prevBudgets;

      const targetBudget = prevBudgets[targetBudgetIndex];
      const budgetMonthYear = targetBudget.month.split('-');
      const budgetYear = parseInt(budgetMonthYear[0]);
      const budgetMonth = parseInt(budgetMonthYear[1]);

      const newSpent = relatedTransactions
        .filter(t => {
          const tDate = new Date(t.date);
          return t.category.toLowerCase() === targetBudget.category.toLowerCase() &&
                 tDate.getFullYear() === budgetYear &&
                 (tDate.getMonth() + 1) === budgetMonth &&
                 t.type === 'expense';
        })
        .reduce((sum, t) => sum + t.amount, 0);

      if (targetBudget.spent === newSpent) return prevBudgets;

      const updatedBudgets = [...prevBudgets];
      updatedBudgets[targetBudgetIndex] = { ...targetBudget, spent: newSpent };
      return updatedBudgets;
    });
  }, []);

  return (
    <BudgetContext.Provider value={{ budgets, isLoading, addBudget, updateBudget, deleteBudget, getBudgetById, updateBudgetSpentAmount, getBudgetsByMonth }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudgetContext = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudgetContext must be used within a BudgetProvider');
  }
  return context;
};
