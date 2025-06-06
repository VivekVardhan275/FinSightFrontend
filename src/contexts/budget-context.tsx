
"use client";

import type { Budget, Transaction, BudgetFromApi as BudgetFromApiType } from '@/types'; // Adjusted import for clarity
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { sampleBudgets } from '@/lib/placeholder-data';
import axios from 'axios';
import { useAuthState } from '@/hooks/use-auth-state';

const BUDGET_API_BASE_URL = "http://localhost:8080/api/user/budgets";

// Type for budget data received from API (without 'spent')
type BudgetFromApi = Omit<BudgetFromApiType, 'spent'>; // Ensure this matches what backend sends

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
  const fetchAttemptedForUserRef = useRef<string | null>(null); // Ref to track fetch per user

  useEffect(() => {
    if (authStatus === 'loading') {
      setIsLoading(true);
      return; 
    }

    if (authStatus === 'authenticated' && user?.email) {
      if (fetchAttemptedForUserRef.current === user.email) {
        // Data already fetched or fetch attempt made for this user, prevent re-fetch.
        return;
      }
      
      setIsLoading(true);
      fetchAttemptedForUserRef.current = user.email;

      axios.get<{ budgets: BudgetFromApi[] }>(`${BUDGET_API_BASE_URL}?email=${encodeURIComponent(user.email)}`)
        .then(response => {
          const apiData = response.data.budgets || response.data; 
          if (Array.isArray(apiData)) {
            const initializedBudgets = apiData.map(b => ({ ...b, spent: 0 })) // Initialize spent
              .sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
            setBudgets(initializedBudgets);
          } else {
            console.warn("API did not return an array for budgets, falling back to localStorage.");
            const stored = localStorage.getItem('app-budgets');
            setBudgets(stored ? JSON.parse(stored) : sampleBudgets.map(b => ({...b, spent: 0 })));
          }
        })
        .catch(error => {
          console.error("Error fetching budgets from API, falling back to localStorage:", error);
          const stored = localStorage.getItem('app-budgets');
          try {
            setBudgets(stored ? JSON.parse(stored) : sampleBudgets.map(b => ({...b, spent: 0 })));
          } catch (e) {
            console.error("Error parsing budgets from localStorage during fallback", e);
            setBudgets(sampleBudgets.map(b => ({...b, spent: 0 })));
          }
          fetchAttemptedForUserRef.current = null; // Allow retry on error
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (authStatus === 'unauthenticated') {
      if (fetchAttemptedForUserRef.current !== null) {
        fetchAttemptedForUserRef.current = null;
      }
      const stored = localStorage.getItem('app-budgets');
      try {
        setBudgets(stored ? JSON.parse(stored) : sampleBudgets.map(b => ({...b, spent: 0 })));
      } catch (e) {
        setBudgets(sampleBudgets.map(b => ({...b, spent: 0 })));
      }
      setIsLoading(false);
    }
  }, [user, authStatus]); // Dependencies are user and authStatus.

  useEffect(() => {
    if (!isLoading && (fetchAttemptedForUserRef.current || authStatus === 'unauthenticated')) {
      localStorage.setItem('app-budgets', JSON.stringify(budgets));
    }
  }, [budgets, isLoading, authStatus]);

  const addBudget = useCallback((budgetFromApi: BudgetFromApi): Budget => {
    const budgetWithSpent = { ...budgetFromApi, spent: 0 };
    setBudgets(prev => [budgetWithSpent, ...prev].sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)));
    return budgetWithSpent;
  }, []);

  const updateBudget = useCallback((budgetDataFromApi: BudgetFromApi) => {
    setBudgets(prev => prev.map(b => {
        if (b.id === budgetDataFromApi.id) {
            return { ...b, ...budgetDataFromApi, spent: b.spent }; // Preserve existing spent, update others
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
