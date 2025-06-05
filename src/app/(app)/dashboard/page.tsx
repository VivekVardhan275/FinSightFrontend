
"use client";

import React, { useMemo } from 'react';
import { ExpenseBreakdownChart } from "@/components/dashboard/expense-breakdown-chart";
import { IncomeOverviewChart } from "@/components/dashboard/income-overview-chart";
import { ExpenseOverviewChart } from "@/components/dashboard/expense-overview-chart";
import { NetSavingsOverviewChart } from "@/components/dashboard/net-savings-overview-chart";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { motion } from "framer-motion";
import { useTransactionContext } from '@/contexts/transaction-context';
import { useBudgetContext } from '@/contexts/budget-context';
import type { SummaryCardData, Transaction, Budget } from '@/types';
import { DollarSign, CreditCard, TrendingUp, PiggyBank } from 'lucide-react';

// Removed pageHeaderBlockMotionVariants

const chartWrapperMotionVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.15, // Keep a small delay for charts after page entry
      duration: 0.4,
      ease: "easeOut",
    },
  },
};


const calculatePercentageChange = (current: number, previous: number): number | null => {
  if (previous === 0) {
    if (current > 0) return Infinity;
    if (current < 0) return -Infinity;
    return 0;
  }
  if (Math.abs(previous) < 0.00001) return current === 0 ? 0 : (current > 0 ? Infinity : -Infinity);

  return ((current - previous) / Math.abs(previous)) * 100;
};

const formatTrendText = (percentage: number | null, type: "income" | "expense" | "savings"): string => {
  if (percentage === null || isNaN(percentage)) return "Data unavailable";
  if (percentage === Infinity) return `Increased (was 0)`;
  if (percentage === -Infinity) return `Decreased (was 0)`;

  const prefix = percentage >= 0 ? "+" : "";
  return `${prefix}${percentage.toFixed(1)}% from last month`;
};


export default function DashboardPage() {
  const { transactions } = useTransactionContext();
  const { budgets } = useBudgetContext();

  const currentMonthDashboardData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthYear = previousMonthDate.getFullYear();
    const previousMonth = previousMonthDate.getMonth(); // 0-indexed


    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === currentMonth;
    });

    const previousMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === previousMonthYear && transactionDate.getMonth() === previousMonth;
    });

    const currentMonthTotalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousMonthTotalIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthTotalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousMonthTotalExpenses = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const incomePercentageChange = calculatePercentageChange(currentMonthTotalIncome, previousMonthTotalIncome);
    const expensePercentageChange = calculatePercentageChange(currentMonthTotalExpenses, previousMonthTotalExpenses);

    const incomeTrendText = formatTrendText(incomePercentageChange, "income");
    const expenseTrendText = formatTrendText(expensePercentageChange, "expense");

    const currentMonthNetSavings = currentMonthTotalIncome - currentMonthTotalExpenses;
    const previousMonthNetSavings = previousMonthTotalIncome - previousMonthTotalExpenses;

    const netSavingsPercentageChange = calculatePercentageChange(currentMonthNetSavings, previousMonthNetSavings);
    const netSavingsTrendText = formatTrendText(netSavingsPercentageChange, "savings");

    const incomeTrendDirection: 'up' | 'down' = (incomePercentageChange === null || incomePercentageChange >= 0) ? 'up' : 'down';

    const expenseIconTrendDirection: 'up' | 'down' = (expensePercentageChange === null || expensePercentageChange > 0) ? 'up' : 'down';

    const netSavingsTrendDirection: 'up' | 'down' = (netSavingsPercentageChange === null || netSavingsPercentageChange >= 0) ? 'up' : 'down';


    const currentMonthBudgets = budgets.filter(b => {
        const budgetMonthYear = b.month.split('-'); // YYYY-MM
        return parseInt(budgetMonthYear[0]) === currentYear && (parseInt(budgetMonthYear[1]) -1) === currentMonth;
    });

    const budgetLeft = currentMonthBudgets.reduce((sum, b) => {
        return sum + (b.allocated - b.spent);
    }, 0);

    const onTrackBudgetsCount = currentMonthBudgets.filter(b => {
        return b.spent <= b.allocated;
    }).length;


    return [
      {
        title: 'Total Income',
        rawValue: currentMonthTotalIncome,
        isCurrency: true,
        icon: React.createElement(DollarSign, { className: "h-6 w-6 text-green-500" }),
        trend: incomeTrendText,
        trendDirection: incomeTrendDirection
      },
      {
        title: 'Total Expenses',
        rawValue: currentMonthTotalExpenses,
        isCurrency: true,
        icon: React.createElement(CreditCard, { className: "h-6 w-6 text-red-500" }),
        trend: expenseTrendText,
        trendDirection: expenseIconTrendDirection
      },
      {
        title: 'Net Savings',
        rawValue: currentMonthNetSavings,
        isCurrency: true,
        icon: React.createElement(TrendingUp, { className: "h-6 w-6 text-primary" }),
        trend: netSavingsTrendText,
        trendDirection: netSavingsTrendDirection
      },
      {
        title: 'Budget Left',
        rawValue: budgetLeft > 0 ? budgetLeft : 0,
        isCurrency: true,
        icon: React.createElement(PiggyBank, { className: "h-6 w-6 text-accent" }),
        trend: `${onTrackBudgetsCount} budgets on track`,
        isSimpleTrend: true,
      },
    ] as SummaryCardData[];

  }, [transactions, budgets]);


  return (
    <div className="space-y-8">
      <div>
        <h1
          className="font-headline text-3xl font-bold tracking-tight"
        >
          Dashboard
        </h1>
        <p
          className="text-muted-foreground"
        >
          Welcome back! Here's your financial overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {currentMonthDashboardData.map((data, index) => (
          <SummaryCard key={data.title} data={data} index={index} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div initial="hidden" animate="visible" variants={chartWrapperMotionVariants} viewport={{ once: true }}>
          <IncomeOverviewChart />
        </motion.div>
        <motion.div initial="hidden" animate="visible" variants={chartWrapperMotionVariants} viewport={{ once: true }}>
          <ExpenseOverviewChart />
        </motion.div>
        <motion.div initial="hidden" animate="visible" variants={chartWrapperMotionVariants} viewport={{ once: true }}>
          <ExpenseBreakdownChart />
        </motion.div>
         <motion.div initial="hidden" animate="visible" variants={chartWrapperMotionVariants} className="md:col-span-2 lg:col-span-1" viewport={{ once: true }}>
          <NetSavingsOverviewChart />
        </motion.div>
      </div>
    </div>
  );
}
