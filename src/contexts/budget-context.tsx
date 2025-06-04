
"use client";

import type { Budget, Transaction } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { sampleBudgets } from '@/lib/placeholder-data';
import { v4 as uuidv4 } from 'uuid';

interface BudgetContextType {
  budgets: Budget[];
  addBudget: (budgetData: Omit<Budget, 'id' | 'spent'>) => Budget;
  updateBudget: (budgetData: Budget) => void;
  deleteBudget: (budgetId: string) => void;
  getBudgetById: (budgetId: string) => Budget | undefined;
  updateBudgetSpentAmount: (budgetId: string, transactions: Transaction[]) => void;
  getBudgetsByMonth: (year: number, month: number) => Budget[];
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    const storedBudgets = localStorage.getItem('app-budgets');
    if (storedBudgets) {
       try {
        setBudgets(JSON.parse(storedBudgets));
      } catch (e) {
        console.error("Error parsing budgets from localStorage", e);
        setBudgets(sampleBudgets); 
      }
    } else {
      setBudgets(sampleBudgets);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app-budgets', JSON.stringify(budgets));
  }, [budgets]);

  const addBudget = useCallback((budgetData: Omit<Budget, 'id' | 'spent'>): Budget => {
    const newBudget: Budget = { ...budgetData, id: uuidv4(), spent: 0 };
    setBudgets(prev => [newBudget, ...prev]);
    return newBudget;
  }, []);

  const updateBudget = useCallback((budgetData: Budget) => {
    setBudgets(prev => prev.map(b => b.id === budgetData.id ? budgetData : b));
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
      return prevBudgets.map(budget => {
        if (budget.id === budgetId) {
          const budgetMonthYear = budget.month.split('-');
          const budgetYear = parseInt(budgetMonthYear[0]);
          const budgetMonth = parseInt(budgetMonthYear[1]);

          const newSpent = relatedTransactions
            .filter(t => {
              const tDate = new Date(t.date);
              return t.category === budget.category &&
                     tDate.getFullYear() === budgetYear &&
                     (tDate.getMonth() + 1) === budgetMonth &&
                     t.type === 'expense';
            })
            .reduce((sum, t) => sum + t.amount, 0);
          return { ...budget, spent: newSpent };
        }
        return budget;
      });
    });
  }, []);


  return (
    <BudgetContext.Provider value={{ budgets, addBudget, updateBudget, deleteBudget, getBudgetById, updateBudgetSpentAmount, getBudgetsByMonth }}>
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
