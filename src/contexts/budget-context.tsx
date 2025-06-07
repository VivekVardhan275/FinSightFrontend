
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
  const [contextIsLoading, setContextIsLoading] = useState(true); // Renamed from isLoading
  const fetchAttemptedForUserRef = useRef<string | null>(null);

  const userEmail = user?.email;

  useEffect(() => {
    if (authStatus === 'loading') {
      if (!contextIsLoading) setContextIsLoading(true);
      return;
    }

    if (authStatus === 'unauthenticated') {
      if (!contextIsLoading) setContextIsLoading(true); // Ensure loading is true before LS access
      try {
        const stored = localStorage.getItem('app-budgets');
        let parsed: Budget[] = [];
        if (stored) {
          const tempParsed = JSON.parse(stored);
          if (Array.isArray(tempParsed)) {
            parsed = tempParsed.map(b => ({ ...b, spent: b.spent || 0 }));
          } else {
            console.warn("BudgetContext (unauth): localStorage 'app-budgets' was not an array:", tempParsed);
          }
        }
        const sortedParsed = parsed.sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
        setBudgets(currentData => JSON.stringify(currentData) === JSON.stringify(sortedParsed) ? currentData : sortedParsed);
      } catch (e) {
        console.error("BudgetContext (unauth): Error processing budgets from localStorage", e);
        setBudgets([]);
      }
      fetchAttemptedForUserRef.current = null;
      setContextIsLoading(false);
      return;
    }

    // Authenticated state
    if (userEmail) {
      if (fetchAttemptedForUserRef.current !== userEmail) {
        if (!contextIsLoading) setContextIsLoading(true);
        fetchAttemptedForUserRef.current = userEmail;

        axios.get<{ budgets: Array<Omit<BudgetFromApiType, 'spent'>> }>(`${BUDGET_API_BASE_URL}?email=${encodeURIComponent(userEmail)}`)
          .then(response => {
            const apiBudgetsRaw = response.data.budgets || response.data;
            let apiBudgets: Array<Omit<BudgetFromApiType, 'spent'>> = [];
            if (Array.isArray(apiBudgetsRaw)) {
              apiBudgets = apiBudgetsRaw;
            } else {
              console.warn("BudgetContext (auth): API response did not contain a 'budgets' array.");
            }
            const initializedBudgets = apiBudgets
              .map(b => ({ ...b, id: b.id.toString(), spent: 0 }))
              .sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
            setBudgets(currentData => JSON.stringify(currentData) === JSON.stringify(initializedBudgets) ? currentData : initializedBudgets);
          })
          .catch(error => {
            console.error("BudgetContext (auth): API error fetching budgets.");
            if (axios.isAxiosError(error) && error.response) {
              console.error("Backend error message:", error.response.data?.message || error.response.data?.error || "No specific message from backend.");
              console.error("Status code:", error.response.status);
            } else if (error instanceof Error) {
              console.error("Error details:", error.message);
            }
            setBudgets([]);
            fetchAttemptedForUserRef.current = null; // Reset on error to allow retry
          })
          .finally(() => {
            setContextIsLoading(false);
          });
      } else {
        // Data already fetched (or fetch attempt completed) for this user.
        // Ensure loading state is false if it isn't already.
        if (contextIsLoading) setContextIsLoading(false);
      }
    } else { // Authenticated but no userEmail (edge case)
      setBudgets([]);
      fetchAttemptedForUserRef.current = null;
      if (contextIsLoading) setContextIsLoading(false);
    }
  }, [userEmail, authStatus, contextIsLoading]); // contextIsLoading added back, internal logic should gate.


  useEffect(() => {
    if (authStatus === 'unauthenticated' && !contextIsLoading) {
      try {
        localStorage.setItem('app-budgets', JSON.stringify(budgets));
      } catch (error) {
        console.error("BudgetContext (unauth): Error saving budgets to localStorage:", error);
      }
    }
  }, [budgets, contextIsLoading, authStatus]);

  const addBudget = useCallback((budgetFromApi: BudgetFromApi): Budget => {
    const budgetWithSpent: Budget = { ...budgetFromApi, spent: 0 };
    setBudgets(prev => [budgetWithSpent, ...prev].sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)));
    return budgetWithSpent;
  }, []);

  const updateBudget = useCallback((budgetDataFromApi: BudgetFromApi) => {
    setBudgets(prev => prev.map(b => {
        if (b.id === budgetDataFromApi.id) {
            return { ...b, ...budgetDataFromApi, spent: b.spent };
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
    <BudgetContext.Provider value={{ budgets, isLoading: contextIsLoading, addBudget, updateBudget, deleteBudget, getBudgetById, updateBudgetSpentAmount, getBudgetsByMonth }}>
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
