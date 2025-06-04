
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

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

export default function DashboardPage() {
  const { transactions } = useTransactionContext();
  const { budgets } = useBudgetContext();

  const currentMonthDashboardData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === currentMonth;
    });

    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = totalIncome - totalExpenses;

    const currentMonthBudgets = budgets.filter(b => {
        const budgetMonthYear = b.month.split('-'); // YYYY-MM
        return parseInt(budgetMonthYear[0]) === currentYear && (parseInt(budgetMonthYear[1]) -1) === currentMonth;
    });
    
    const budgetLeft = currentMonthBudgets.reduce((sum, b) => {
        const spentOnBudget = currentMonthTransactions
            .filter(t => t.type === 'expense' && t.category === b.category)
            .reduce((s, t) => s + t.amount, 0);
        return sum + (b.allocated - spentOnBudget);
    }, 0);
    
    const onTrackBudgetsCount = currentMonthBudgets.filter(b => {
        const spentOnBudget = currentMonthTransactions
            .filter(t => t.type === 'expense' && t.category === b.category)
            .reduce((s, t) => s + t.amount, 0);
        return spentOnBudget <= b.allocated;
    }).length;


    return [
      { 
        title: 'Total Income', 
        rawValue: totalIncome, 
        isCurrency: true,
        icon: React.createElement(DollarSign, { className: "h-6 w-6 text-green-500" }), 
        trend: '+X% this month', 
        trendDirection: 'up' 
      },
      { 
        title: 'Total Expenses', 
        rawValue: totalExpenses, 
        isCurrency: true,
        icon: React.createElement(CreditCard, { className: "h-6 w-6 text-red-500" }), 
        trend: '-Y% this month', 
        trendDirection: 'down' 
      },
      { 
        title: 'Net Savings', 
        rawValue: netSavings, 
        isCurrency: true,
        icon: React.createElement(TrendingUp, { className: "h-6 w-6 text-primary" }), 
        trend: 'Improving', 
        trendDirection: netSavings >= 0 ? 'up' : 'down' 
      },
      { 
        title: 'Budget Left', 
        rawValue: budgetLeft > 0 ? budgetLeft : 0, // Show 0 if negative
        isCurrency: true,
        icon: React.createElement(PiggyBank, { className: "h-6 w-6 text-accent" }), 
        trend: `${onTrackBudgetsCount} budgets on track`, 
        trendDirection: 'up' 
      },
    ] as SummaryCardData[];

  }, [transactions, budgets]);
  
  const summaryCardCount = currentMonthDashboardData.length;

  return (
    <div className="space-y-8">
      <div>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5 }}
          className="font-headline text-3xl font-bold tracking-tight"
        >
          Dashboard
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-muted-foreground"
        >
          Welcome back! Here's your financial overview.
        </motion.p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {currentMonthDashboardData.map((data, index) => (
          <SummaryCard key={data.title} data={data} index={index} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div custom={summaryCardCount} variants={cardVariants} initial="hidden" animate="visible">
          <IncomeOverviewChart />
        </motion.div>
        <motion.div custom={summaryCardCount + 1} variants={cardVariants} initial="hidden" animate="visible">
          <ExpenseOverviewChart />
        </motion.div>
        <motion.div custom={summaryCardCount + 2} variants={cardVariants} initial="hidden" animate="visible">
          <ExpenseBreakdownChart />
        </motion.div>
         <motion.div custom={summaryCardCount + 3} variants={cardVariants} initial="hidden" animate="visible" className="md:col-span-2 lg:col-span-1">
          <NetSavingsOverviewChart />
        </motion.div>
      </div>
    </div>
  );
}
