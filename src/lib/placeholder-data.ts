
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
  // Adding more data for previous months to make charts more interesting
  { id: 't9', date: '2024-05-15', description: 'Salary May', category: 'Income', amount: 4900, type: 'income' },
  { id: 't10', date: '2024-05-20', description: 'Utilities May', category: 'Utilities', amount: 150, type: 'expense' },
  { id: 't11', date: '2024-05-05', description: 'Groceries May', category: 'Food', amount: 80, type: 'expense' },
  { id: 't12', date: '2024-04-15', description: 'Salary Apr', category: 'Income', amount: 4950, type: 'income' },
  { id: 't13', date: '2024-04-10', description: 'Car Insurance', category: 'Transport', amount: 120, type: 'expense' },
  { id: 't14', date: '2024-03-15', description: 'Salary Mar', category: 'Income', amount: 4800, type: 'income' },
  { id: 't15', date: '2024-03-20', description: 'Internet Bill', category: 'Utilities', amount: 60, type: 'expense' },
  { id: 't16', date: '2024-02-15', description: 'Salary Feb', category: 'Income', amount: 4700, type: 'income' },
  { id: 't17', date: '2024-02-01', description: 'Student Loan', category: 'Education', amount: 300, type: 'expense' },
];

export const sampleBudgets: Budget[] = [
  { id: 'b1', category: 'Food', allocated: 500, spent: 0, month: '2024-07' },
  { id: 'b2', category: 'Transport', allocated: 150, spent: 0, month: '2024-07' },
  { id: 'b3', category: 'Entertainment', allocated: 200, spent: 0, month: '2024-07' },
  { id: 'b4', category: 'Utilities', allocated: 300, spent: 0, month: '2024-07' },
  { id: 'b5', category: 'Food', allocated: 480, spent: 0, month: '2024-06' },
  { id: 'b6', category: 'Housing', allocated: 1200, spent: 0, month: '2024-06' },
];


// expenseCategoriesData is no longer needed as the pie chart is dynamic.
// incomeHistory, expenseHistory, and netSavingsHistory are also no longer needed as charts are dynamic.
