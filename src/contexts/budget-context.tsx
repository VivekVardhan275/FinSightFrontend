
"use client";

import type { Budget, Transaction, BudgetFromApi as BudgetFromApiType } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import axios from 'axios';
import { useAuthState } from '@/hooks/use-auth-state';
import { useTransactionContext } from './transaction-context';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const BUDGET_API_BASE_URL = `${backendUrl}/api/user/budgets`;

const addRandomQueryParam = (url: string, paramName: string = '_cb'): string => {
  const randomString = Math.random().toString(36).substring(2, 10);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${paramName}=${randomString}`;
};

type BudgetFromApi = Omit<BudgetFromApiType, 'spent'>;

interface BudgetContextType {
  budgets: Budget[];
  isLoading: boolean;
  addBudget: (budgetFromApi: BudgetFromApi) => Budget;
  updateBudget: (budgetDataFromApi: BudgetFromApi, currentTransactions: Transaction[]) => void;
  deleteBudget: (budgetId: string) => void;
  getBudgetById: (budgetId: string) => Budget | undefined;
  updateBudgetSpentAmount: (budgetId: string, allTransactions: Transaction[]) => void;
  getBudgetsByMonth: (year: number, month: number) => Budget[];
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const { user, status: authStatus } = useAuthState();
  const { transactions: contextTransactions, isLoading: isLoadingTransactions } = useTransactionContext(); 
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
      if (contextIsLoading) setContextIsLoading(false);
      return;
    }

    if (userEmail) {
      if (fetchAttemptedForUserRef.current !== userEmail) {
        if (!contextIsLoading) setContextIsLoading(true);
        fetchAttemptedForUserRef.current = userEmail; 

        const apiUrl = `${BUDGET_API_BASE_URL}?email=${encodeURIComponent(userEmail)}`;
        axios.get<{ budgets: Array<Omit<BudgetFromApiType, 'spent'>> }>(addRandomQueryParam(apiUrl))
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
              if (error.response.status !== 404) {
                fetchAttemptedForUserRef.current = null;
              }
            } else if (error instanceof Error) {
              console.error("Error details:", error.message);
              fetchAttemptedForUserRef.current = null;
            } else {
              fetchAttemptedForUserRef.current = null;
            }
            setBudgets([]);
          })
          .finally(() => {
            if (contextIsLoading) setContextIsLoading(false);
          });
      } else {
        if (contextIsLoading) setContextIsLoading(false);
      }
    } else {
      setBudgets([]);
      fetchAttemptedForUserRef.current = null;
      if (contextIsLoading) setContextIsLoading(false);
    }
  }, [userEmail, authStatus, contextIsLoading]);


  useEffect(() => {
    // FIX: Only run this calculation if data is loaded and budgets exist.
    // This prevents running setBudgets during a render cycle triggered by an API error state update.
    if (contextIsLoading || isLoadingTransactions || budgets.length === 0) {
      return;
    }

    let anySpentAmountChanged = false;
    const recalculatedBudgets = budgets.map(budget => {
      const budgetMonthYear = budget.month.split('-');
      const budgetYear = parseInt(budgetMonthYear[0]);
      const budgetMonth = parseInt(budgetMonthYear[1]);

      const newSpent = contextTransactions 
        .filter(t => {
          const tDate = new Date(t.date);
          return t.category.toLowerCase() === budget.category.toLowerCase() &&
                 tDate.getFullYear() === budgetYear &&
                 (tDate.getMonth() + 1) === budgetMonth &&
                 t.type === 'expense';
        })
        .reduce((sum, t) => sum + t.amount, 0);

      if (budget.spent === undefined || Math.abs(budget.spent - newSpent) >= 0.001) {
        anySpentAmountChanged = true;
        return { ...budget, spent: newSpent };
      }
      return budget;
    });

    if (anySpentAmountChanged) {
      setBudgets(recalculatedBudgets.sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)));
    }
  }, [budgets, contextTransactions, contextIsLoading, isLoadingTransactions]);


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
    const budgetWithSpent: Budget = { ...budgetFromApi, id: budgetFromApi.id.toString(), spent: 0 };
    setBudgets(prev => [budgetWithSpent, ...prev].sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)));
    return budgetWithSpent;
  }, []);

  const updateBudget = useCallback((budgetDataFromApi: BudgetFromApi, currentTransactions: Transaction[]) => {
    setBudgets(prevBudgets => {
        const updatedBudgets = prevBudgets.map(b => {
            if (b.id === budgetDataFromApi.id.toString()) {
                const newCategory = budgetDataFromApi.category;
                const newMonth = budgetDataFromApi.month;
                const newAllocated = budgetDataFromApi.allocated;

                // Calculate spent using the provided currentTransactions
                const budgetMonthYear = newMonth.split('-');
                const budgetYear = parseInt(budgetMonthYear[0]);
                const budgetMonthNum = parseInt(budgetMonthYear[1]);
                const calculatedSpent = currentTransactions
                    .filter(t => {
                        const tDate = new Date(t.date);
                        return t.category.toLowerCase() === newCategory.toLowerCase() &&
                            tDate.getFullYear() === budgetYear &&
                            (tDate.getMonth() + 1) === budgetMonthNum &&
                            t.type === 'expense';
                    })
                    .reduce((sum, t) => sum + t.amount, 0);

                return {
                    id: budgetDataFromApi.id.toString(),
                    category: newCategory,
                    allocated: newAllocated,
                    month: newMonth,
                    spent: calculatedSpent,
                };
            }
            return b;
        });
        return updatedBudgets.sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
    });
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

  const updateBudgetSpentAmount = useCallback((budgetId: string, allTransactions: Transaction[]) => {
    setBudgets(prevBudgets => {
      const targetBudgetIndex = prevBudgets.findIndex(b => b.id === budgetId);
      if (targetBudgetIndex === -1) return prevBudgets;

      const targetBudget = prevBudgets[targetBudgetIndex];
      const budgetMonthYear = targetBudget.month.split('-');
      const budgetYear = parseInt(budgetMonthYear[0]);
      const budgetMonth = parseInt(budgetMonthYear[1]);

      const newSpent = allTransactions
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

      const updatedBudgetsArray = [...prevBudgets];
      updatedBudgetsArray[targetBudgetIndex] = { ...targetBudget, spent: newSpent };
      return updatedBudgetsArray.sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
    });
  }, []);


  return (
    <BudgetContext.Provider value={{
        budgets,
        isLoading: contextIsLoading || isLoadingTransactions,
        addBudget,
        updateBudget,
        deleteBudget,
        getBudgetById,
        updateBudgetSpentAmount,
        getBudgetsByMonth
    }}>
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
