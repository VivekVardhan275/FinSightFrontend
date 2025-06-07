
"use client";

import type { Budget, Transaction, BudgetFromApi as BudgetFromApiType } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import axios from 'axios';
import { useAuthState } from '@/hooks/use-auth-state';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const BUDGET_API_BASE_URL = `${backendUrl}/api/user/budgets`;

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
      if (!isLoading) setIsLoading(true);
      return; // Early exit if auth is still loading
    }

    if (authStatus === 'unauthenticated') {
      let parsed: Budget[] = [];
      try {
        const stored = localStorage.getItem('app-budgets');
        parsed = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error("Error parsing budgets from localStorage for unauthenticated user", e);
        // Keep parsed as empty array
      }
       setBudgets(currentData => {
        if (JSON.stringify(currentData) === JSON.stringify(parsed)) {
          return currentData;
        }
        return parsed;
      });
      if (isLoading) setIsLoading(false);
      fetchAttemptedForUserRef.current = null; // Reset fetch attempt flag
      return; // Early exit
    }

    // At this point, authStatus === 'authenticated'
    if (userEmail) {
      if (fetchAttemptedForUserRef.current !== userEmail) {
        // Need to fetch for this user
        if (!isLoading) setIsLoading(true); // Set loading before initiating fetch
        fetchAttemptedForUserRef.current = userEmail; // Mark fetch as attempted for this user

        axios.get<{ budgets: Array<Omit<BudgetFromApiType, 'spent'>> }>(`${BUDGET_API_BASE_URL}?email=${encodeURIComponent(userEmail)}`)
          .then(response => {
            const apiBudgetsRaw = response.data.budgets || response.data;
            const apiBudgets = Array.isArray(apiBudgetsRaw) ? apiBudgetsRaw : [];

            const initializedBudgets = apiBudgets
              .map(b => ({ ...b, spent: 0 })) // Initialize spent to 0
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
            fetchAttemptedForUserRef.current = null; // Allow retry on error for this user
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Fetch already attempted or in progress for this user.
        // If isLoading is true, it means a fetch is ongoing, .finally() will set it to false.
      }
    } else {
      // Authenticated, but no userEmail
      if (isLoading) setIsLoading(false);
      setBudgets([]);
      fetchAttemptedForUserRef.current = null;
    }
  }, [userEmail, authStatus, isLoading]); // Added isLoading to deps, check for loops. No, keep it off like before.

  useEffect(() => {
    if (!isLoading && (fetchAttemptedForUserRef.current === userEmail || authStatus === 'unauthenticated')) {
      try {
        localStorage.setItem('app-budgets', JSON.stringify(budgets));
      } catch (error) {
        console.error("Error saving budgets to localStorage:", error);
      }
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
            return { ...budgetDataFromApi, spent: b.spent }; // Preserve existing spent
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

      if (Math.abs(targetBudget.spent - newSpent) < 0.001) {
        return prevBudgets;
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
