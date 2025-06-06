
"use client";

import type { Budget, Transaction, BudgetFromApi as BudgetFromApiType } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
// import { sampleBudgets } from '@/lib/placeholder-data'; // No longer using sampleBudgets as primary fallback
import axios from 'axios';
import { useAuthState } from '@/hooks/use-auth-state';

const BUDGET_API_BASE_URL = "http://localhost:8080/api/user/budgets";

type BudgetFromApi = Omit<BudgetFromApiType, 'spent' | 'id'> & { id: string };

interface BudgetContextType {
  budgets: Budget[];
  isLoading: boolean;
  addBudget: (budgetFromApi: BudgetFromApi) => Budget;
  updateBudget: (budgetDataFromApi: BudgetFromApi) => void;
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
  const fetchAttemptedForUserRef = useRef<string | null>(null);

  const userEmail = user?.email; // Stable variable for user's email

  useEffect(() => {
    if (authStatus === 'loading') {
      if(!isLoading) setIsLoading(true);
      return;
    }

    if (authStatus === 'authenticated' && userEmail) {
      if (fetchAttemptedForUserRef.current !== userEmail) {
        setIsLoading(true);
        fetchAttemptedForUserRef.current = userEmail;

        axios.get<{ budgets: Array<Omit<BudgetFromApiType, 'spent'>> }>(`${BUDGET_API_BASE_URL}?email=${encodeURIComponent(userEmail)}`)
          .then(response => {
            const apiBudgets = response.data.budgets || response.data; // Backend response might be {budgets: []} or just []
             if (Array.isArray(apiBudgets)) {
              const initializedBudgets = apiBudgets
                .map(b => ({ ...b, spent: 0 }))
                .sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
              
              setBudgets(currentData => {
                if (JSON.stringify(currentData) === JSON.stringify(initializedBudgets)) {
                  return currentData;
                }
                return initializedBudgets;
              });
            } else {
              console.warn("API did not return an array for budgets, defaulting to empty.");
              setBudgets([]);
            }
          })
          .catch(error => {
            console.error("Error fetching budgets from API, defaulting to empty:", error);
            setBudgets([]);
            fetchAttemptedForUserRef.current = null; // Allow retry on error
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
         if (isLoading) setIsLoading(false);
      }
    } else if (authStatus === 'unauthenticated') {
      const stored = localStorage.getItem('app-budgets');
      try {
        const parsed = stored ? JSON.parse(stored) : []; // Default to empty array
        setBudgets(currentData => JSON.stringify(currentData) === JSON.stringify(parsed) ? currentData : parsed);
      } catch (e) {
        console.error("Error parsing budgets from localStorage during fallback", e);
        setBudgets([]);
      }
      if (isLoading) setIsLoading(false);
      fetchAttemptedForUserRef.current = null;
    }
  }, [userEmail, authStatus]); // isLoading intentionally omitted

  useEffect(() => {
    if (!isLoading && (fetchAttemptedForUserRef.current === userEmail || authStatus === 'unauthenticated')) {
      localStorage.setItem('app-budgets', JSON.stringify(budgets));
    }
  }, [budgets, isLoading, userEmail, authStatus]);

  const addBudget = useCallback((budgetFromApi: BudgetFromApi): Budget => {
    const budgetWithSpent = { ...budgetFromApi, spent: 0 };
    setBudgets(prev => [budgetWithSpent, ...prev].sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)));
    return budgetWithSpent;
  }, []);

  const updateBudget = useCallback((budgetDataFromApi: BudgetFromApi) => {
    setBudgets(prev => prev.map(b => {
        if (b.id === budgetDataFromApi.id) {
            return { ...budgetDataFromApi, spent: b.spent };
        }
        return b;
    }).sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)));
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
