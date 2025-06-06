
"use client";

import type { Budget, Transaction, BudgetFromApi as BudgetFromApiType } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
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

        axios.get<{ budgets: Array<Omit<BudgetFromApiType, 'spent'>> }>(`${BUDGET_API_BASE_URL}?email=${encodeURIComponent(userEmail)}`)
          .then(response => {
            const apiBudgetsRaw = response.data.budgets || response.data; 
            const apiBudgets = Array.isArray(apiBudgetsRaw) ? apiBudgetsRaw : [];

            const initializedBudgets = apiBudgets
              .map(b => ({ ...b, spent: 0 })) // Initialize spent to 0 as backend doesn't send it
              .sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
            
            setBudgets(currentData => {
              if (JSON.stringify(currentData) === JSON.stringify(initializedBudgets)) {
                return currentData;
              }
              return initializedBudgets;
            });
          })
          .catch(error => {
            console.error("Error fetching budgets from API:", error);
            setBudgets([]); // Default to empty on error
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
      const stored = localStorage.getItem('app-budgets');
      let parsed: Budget[] = [];
      try {
        parsed = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error("Error parsing budgets from localStorage for unauthenticated user", e);
        parsed = [];
      }
      setBudgets(currentData => JSON.stringify(currentData) === JSON.stringify(parsed) ? currentData : parsed);
      if (isLoading) setIsLoading(false);
      fetchAttemptedForUserRef.current = null;
    }
  // Removed isLoading from dependency array
  }, [userEmail, authStatus]); 

  useEffect(() => {
    // Save to localStorage only when not loading, and fetch has been attempted for the current user (or unauthenticated)
    if (!isLoading && (fetchAttemptedForUserRef.current === userEmail || authStatus === 'unauthenticated')) {
      localStorage.setItem('app-budgets', JSON.stringify(budgets));
    }
  }, [budgets, isLoading, userEmail, authStatus]);

  const addBudget = useCallback((budgetFromApi: BudgetFromApi): Budget => {
    // Backend doesn't send 'spent', so initialize it to 0
    const budgetWithSpent = { ...budgetFromApi, spent: 0 };
    setBudgets(prev => [budgetWithSpent, ...prev].sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)));
    return budgetWithSpent;
  }, []);

  const updateBudget = useCallback((budgetDataFromApi: BudgetFromApi) => {
    setBudgets(prev => prev.map(b => {
        if (b.id === budgetDataFromApi.id) {
            // Backend doesn't send 'spent', so preserve the existing frontend-calculated 'spent'
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
        .reduce((sum, t) => sum + t.amount, 0); // Amounts are in INR

      if (Math.abs(targetBudget.spent - newSpent) < 0.001) { // Compare with a small tolerance for floating point
        return prevBudgets; // No change needed
      }

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
