import type { Transaction, Budget, SummaryCardData } from '@/types';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, Landmark, Percent } from 'lucide-react';

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

export const dashboardSummaryData: SummaryCardData[] = [
  { title: 'Current Balance', value: '$12,345.67', icon: <Wallet className="h-6 w-6 text-primary" />, trend: '+ $1,200 this month', trendDirection: 'up' },
  { title: 'Total Income', value: '$5,600.00', icon: <DollarSign className="h-6 w-6 text-green-500" />, trend: '+ 10% from last month', trendDirection: 'up' },
  { title: 'Total Expenses', value: '$1,875.49', icon: <CreditCard className="h-6 w-6 text-red-500" />, trend: '- 5% from last month', trendDirection: 'down' },
  { title: 'Budget Usage', value: '75%', icon: <Percent className="h-6 w-6 text-accent" />, trend: '3 of 4 budgets on track', trendDirection: 'up' },
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
