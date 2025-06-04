
import React from 'react';
import type { Transaction, Budget, SummaryCardData } from '@/types';
import { DollarSign, CreditCard, TrendingUp, Wallet, PiggyBank } from 'lucide-react';

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
  { id: 'b1', category: 'Food', allocated: 500, spent: 250.75, month: '2024-07' },
  { id: 'b2', category: 'Transport', allocated: 150, spent: 90.00, month: '2024-07' },
  { id: 'b3', category: 'Entertainment', allocated: 200, spent: 180.50, month: '2024-07' },
  { id: 'b4', category: 'Utilities', allocated: 300, spent: 275.00, month: '2024-07' },
];

// Placeholder calculations for July 2024
const julyIncome = sampleTransactions
  .filter(t => t.type === 'income' && t.date.startsWith('2024-07'))
  .reduce((sum, t) => sum + t.amount, 0);

const julyExpenses = sampleTransactions
  .filter(t => t.type === 'expense' && t.date.startsWith('2024-07'))
  .reduce((sum, t) => sum + t.amount, 0);

const julyNetSavings = julyIncome - julyExpenses;

const julyBudgetLeft = sampleBudgets
  .filter(b => b.month === '2024-07' && b.allocated > b.spent)
  .reduce((sum, b) => sum + (b.allocated - b.spent), 0);


export const dashboardSummaryData: SummaryCardData[] = [
  { 
    title: 'Total Income', 
    rawValue: julyIncome, 
    isCurrency: true,
    icon: React.createElement(DollarSign, { className: "h-6 w-6 text-green-500" }), 
    trend: '+10% this month', // Placeholder trend
    trendDirection: 'up' 
  },
  { 
    title: 'Total Expenses', 
    rawValue: julyExpenses, 
    isCurrency: true,
    icon: React.createElement(CreditCard, { className: "h-6 w-6 text-red-500" }), 
    trend: '-5% this month', // Placeholder trend
    trendDirection: 'down' 
  },
  { 
    title: 'Net Savings', 
    rawValue: julyNetSavings, 
    isCurrency: true,
    icon: React.createElement(TrendingUp, { className: "h-6 w-6 text-primary" }), 
    trend: 'Improving steadily', // Placeholder trend
    trendDirection: julyNetSavings >= 0 ? 'up' : 'down' 
  },
  { 
    title: 'Budget Left', 
    rawValue: julyBudgetLeft, 
    isCurrency: true,
    icon: React.createElement(PiggyBank, { className: "h-6 w-6 text-accent" }), 
    trend: `${sampleBudgets.filter(b => b.month === '2024-07' && b.spent <= b.allocated).length} budgets on track`, // Placeholder trend
    trendDirection: 'up' 
  },
];

// For charts
export const balanceHistory = [
  { month: 'Jan', balance: 8000 },
  { month: 'Feb', balance: 9500 },
  { month: 'Mar', balance: 9000 },
  { month: 'Apr', balance: 10500 },
  { month: 'May', balance: 11000 },
  { month: 'Jun', balance: 12345 },
];

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
