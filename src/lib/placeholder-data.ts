
import React from 'react';
import type { Transaction, Budget, SummaryCardData } from '@/types';
// Icons are now dynamically created in DashboardPage, so direct import here is not strictly necessary for dashboardSummaryData
// import { DollarSign, CreditCard, TrendingUp, Wallet, PiggyBank } from 'lucide-react';

export const sampleTransactions: Transaction[] = [
  { id: '1', date: '2024-07-15', description: 'Salary Deposit', category: 'Income', amount: 5000, type: 'income' },
  { id: '2', date: '2024-07-16', description: 'Groceries', category: 'Food', amount: 75.50, type: 'expense' },
  { id: '3', date: '2024-07-17', description: 'Netflix Subscription', category: 'Entertainment', amount: 15.99, type: 'expense' },
  { id: '4', date: '2024-07-18', description: 'Freelance Project', category: 'Income', amount: 600, type: 'income' },
  { id: '5', date: '2024-07-20', description: 'Gasoline', category: 'Transport', amount: 50.00, type: 'expense' },
  { id: '6', date: '2024-07-22', description: 'Dinner Out', category: 'Food', amount: 45.00, type: 'expense' },
  { id: '7', date: '2024-06-25', description: 'Rent Payment', category: 'Housing', amount: 1200, type: 'expense' },
  { id: '8', date: '2024-06-01', description: 'Salary June', category: 'Income', amount: 5000, type: 'income' },
];

export const sampleBudgets: Budget[] = [
  { id: 'b1', category: 'Food', allocated: 500, spent: 0, month: '2024-07' }, // Spent will be dynamically calculated
  { id: 'b2', category: 'Transport', allocated: 150, spent: 0, month: '2024-07' },
  { id: 'b3', category: 'Entertainment', allocated: 200, spent: 0, month: '2024-07' },
  { id: 'b4', category: 'Utilities', allocated: 300, spent: 0, month: '2024-07' },
];

// dashboardSummaryData is now dynamically generated in DashboardPage.
// This can be removed or kept for reference/other uses if needed.
/*
export const dashboardSummaryData: SummaryCardData[] = [
  // ... This data is now generated dynamically in DashboardPage ...
];
*/

// For charts (these remain static for now)
export const incomeExpenseData = [
  { name: 'Income', value: 5600, fill: 'hsl(var(--chart-1))' },
  { name: 'Expenses', value: 1875, fill: 'hsl(var(--chart-2))' },
];

export const expenseCategoriesData = [
  { category: 'Food', value: 400, fill: 'hsl(var(--chart-1))' },
  { category: 'Transport', value: 300, fill: 'hsl(var(--chart-2))' },
  { category: 'Entertainment', value: 200, fill: 'hsl(var(--chart-3))' },
  { category: 'Utilities', value: 500, fill: 'hsl(var(--chart-4))' },
  { category: 'Other', value: 475, fill: 'hsl(var(--chart-5))' },
];

// For Income Overview Chart
export const incomeHistory = [
  { month: 'Jan', income: 4800 },
  { month: 'Feb', income: 5200 },
  { month: 'Mar', income: 5000 },
  { month: 'Apr', income: 5500 },
  { month: 'May', income: 5300 },
  { month: 'Jun', income: 5800 },
];

// For Expense Overview Chart
export const expenseHistory = [
  { month: 'Jan', expenses: 2200 },
  { month: 'Feb', expenses: 2500 },
  { month: 'Mar', expenses: 2300 },
  { month: 'Apr', expenses: 2800 },
  { month: 'May', expenses: 2600 },
  { month: 'Jun', expenses: 3000 },
];

// For Net Savings Overview Chart
export const netSavingsHistory = [
  { month: 'Jan', netSavings: 2600 },
  { month: 'Feb', netSavings: 2700 },
  { month: 'Mar', netSavings: 2700 },
  { month: 'Apr', netSavings: 2700 },
  { month: 'May', netSavings: 2700 },
  { month: 'Jun', netSavings: 2800 },
];
