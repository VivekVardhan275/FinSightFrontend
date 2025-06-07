
"use client";

import type { Budget, Transaction, BudgetFromApi as BudgetFromApiType } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import axios from 'axios';
import { useAuthState } from '@/hooks/use-auth-state';
import { useTransactionContext } from './transaction-context'; // Import TransactionContext

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const BUDGET_API_BASE_URL = `${backendUrl}/api/user/budgets`;

// This is the type coming from the API (e.g. after a POST or PUT)
// It doesn't have 'spent', and 'id' is a string.
type BudgetFromApi = Omit<BudgetFromApiType, 'spent'>;


interface BudgetContextType {
  budgets: Budget[];
  isLoading: boolean;
  addBudget: (budgetFromApi: BudgetFromApi) => Budget;
  updateBudget: (budgetDataFromApi: BudgetFromApi) => void;
  deleteBudget: (budgetId: string) => void;
  getBudgetById: (budgetId: string) => Budget | undefined;
  updateBudgetSpentAmount: (budgetId: string, allTransactions: Transaction[]) => void;
  getBudgetsByMonth: (year: number, month: number) => Budget[];
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const { user, status: authStatus } = useAuthState();
  const { transactions, isLoading: isLoadingTransactions } = useTransactionContext();
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
      setContextIsLoading(false);
      return;
    }

    if (userEmail) {
      if (fetchAttemptedForUserRef.current !== userEmail) {
        if (!contextIsLoading) setContextIsLoading(true);
        
        axios.get<{ budgets: Array<Omit<BudgetFromApiType, 'spent'>> }>(`${BUDGET_API_BASE_URL}?email=${encodeURIComponent(userEmail)}`)
          .then(response => {
            fetchAttemptedForUserRef.current = userEmail;
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
              } else {
                 fetchAttemptedForUserRef.current = userEmail;
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
    if (!contextIsLoading && !isLoadingTransactions && budgets.length > 0) {
      let anySpentAmountChanged = false;
      const recalculatedBudgets = budgets.map(budget => {
        const budgetMonthYear = budget.month.split('-');
        const budgetYear = parseInt(budgetMonthYear[0]);
        const budgetMonth = parseInt(budgetMonthYear[1]);

        const newSpent = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return t.category.toLowerCase() === budget.category.toLowerCase() &&
                   tDate.getFullYear() === budgetYear &&
                   (tDate.getMonth() + 1) === budgetMonth &&
                   t.type === 'expense';
          })
          .reduce((sum, t) => sum + t.amount, 0);

        if (Math.abs(budget.spent - newSpent) >= 0.001) {
          anySpentAmountChanged = true;
          return { ...budget, spent: newSpent };
        }
        return budget;
      });

      if (anySpentAmountChanged) {
        setBudgets(recalculatedBudgets.sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)));
      }
    }
  }, [budgets, transactions, contextIsLoading, isLoadingTransactions]);


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
    setBudgets(prevBudgets => {
      const updatedBudgets = prevBudgets.map(b => {
        if (b.id === budgetDataFromApi.id) {
          // budgetDataFromApi contains the updated fields from the API (id, category, allocated in INR, month)
          // Recalculate spent for this specific budget immediately
          const budgetMonthYear = budgetDataFromApi.month.split('-');
          const budgetYear = parseInt(budgetMonthYear[0]);
          const budgetMonth = parseInt(budgetMonthYear[1]);

          const newSpentForThisBudget = transactions // `transactions` from useTransactionContext
            .filter(t => {
              const tDate = new Date(t.date);
              return t.category.toLowerCase() === budgetDataFromApi.category.toLowerCase() &&
                     tDate.getFullYear() === budgetYear &&
                     (tDate.getMonth() + 1) === budgetMonth &&
                     t.type === 'expense';
            })
            .reduce((sum, t) => sum + t.amount, 0);
          
          return { 
            ...budgetDataFromApi, // has id, new category, new allocated (INR), new month
            spent: newSpentForThisBudget // immediately calculated spent (INR)
          };
        }
        return b;
      });
      return updatedBudgets.sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
    });
  }, [transactions]); // Added transactions as a dependency

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

      const updatedBudgets = [...prevBudgets];
      updatedBudgets[targetBudgetIndex] = { ...targetBudget, spent: newSpent };
      return updatedBudgets.sort((a,b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
    });
  }, []);


  return (
    <BudgetContext.Provider value={{ budgets, isLoading: contextIsLoading || isLoadingTransactions, addBudget, updateBudget, deleteBudget, getBudgetById, updateBudgetSpentAmount, getBudgetsByMonth }}>
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


    