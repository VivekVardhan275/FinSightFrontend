
"use client";

import { AppLogo } from "@/components/icons";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserNav } from "@/components/layout/user-nav";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarRail
} from "@/components/ui/sidebar";
import { useAuthState } from "@/hooks/use-auth-state";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CurrencyProvider, useCurrency } from "@/contexts/currency-context";
import { NotificationProvider, useNotification } from "@/contexts/notification-context";
import { NotificationBell } from "@/components/layout/notification-bell";
import { TransactionProvider, useTransactionContext } from "@/contexts/transaction-context";
import { BudgetProvider, useBudgetContext } from "@/contexts/budget-context";
import type { Budget } from "@/types";
import { formatCurrency } from "@/lib/utils";


function BudgetNotificationEffect() {
  const { budgets, getBudgetsByMonth } = useBudgetContext();
  const { transactions, getTransactionsByCategoryAndMonth } = useTransactionContext();
  const { addNotification } = useNotification();
  const { selectedCurrency, convertAmount } = useCurrency();
  const [notifiedLayoutBudgets, setNotifiedLayoutBudgets] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storedNotified = localStorage.getItem('app-layout-notified-budgets');
    if (storedNotified) {
      try {
        setNotifiedLayoutBudgets(new Set(JSON.parse(storedNotified)));
      } catch (e) {
        console.error("Error parsing layout notified budgets from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app-layout-notified-budgets', JSON.stringify(Array.from(notifiedLayoutBudgets)));
  }, [notifiedLayoutBudgets]);

  const checkAndNotifyGlobalBudgets = React.useCallback(() => {
    if (!budgets || budgets.length === 0) return;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

    const currentMonthBudgets = getBudgetsByMonth(currentYear, currentMonth);

    currentMonthBudgets.forEach(budget => {
      const budgetTransactions = getTransactionsByCategoryAndMonth(budget.category, currentYear, currentMonth);
      const currentSpent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);

      const percentageSpent = budget.allocated > 0 ? (currentSpent / budget.allocated) * 100 : 0;
      const budgetId = budget.id;

      const displaySpent = convertAmount(currentSpent, selectedCurrency);
      const displayAllocated = convertAmount(budget.allocated, selectedCurrency);

      const exceededKey = `layout-${budgetId}-exceeded`;
      const nearingKey = `layout-${budgetId}-nearing`;

      if (currentSpent > budget.allocated) {
        if (!notifiedLayoutBudgets.has(exceededKey)) {
          addNotification({
            title: "Budget Exceeded!",
            description: `You've exceeded budget for ${budget.category} (${budget.month}). Spent: ${formatCurrency(displaySpent, selectedCurrency)}, Allocated: ${formatCurrency(displayAllocated, selectedCurrency)}.`,
            type: "error",
            href: "/budgets"
          });
          setNotifiedLayoutBudgets(prev => {
            const newSet = new Set(prev);
            newSet.add(exceededKey);
            newSet.delete(nearingKey); // Remove nearing if it was there
            return newSet;
          });
        }
      } else if (percentageSpent >= 85) {
        if (!notifiedLayoutBudgets.has(nearingKey) && !notifiedLayoutBudgets.has(exceededKey)) {
          addNotification({
            title: "Budget Nearing Limit",
            description: `Spent ${percentageSpent.toFixed(0)}% of budget for ${budget.category} (${budget.month}). Spent: ${formatCurrency(displaySpent, selectedCurrency)}, Allocated: ${formatCurrency(displayAllocated, selectedCurrency)}.`,
            type: "warning",
            href: "/budgets"
          });
          setNotifiedLayoutBudgets(prev => new Set(prev).add(nearingKey));
        }
      } else {
        // Budget is okay, clear any previous notifications for it from layout tracking
        let changed = false;
        const newSet = new Set(notifiedLayoutBudgets);
        if (newSet.has(nearingKey)) {
          newSet.delete(nearingKey);
          changed = true;
        }
        if (newSet.has(exceededKey)) {
          newSet.delete(exceededKey);
          changed = true;
        }
        if (changed) {
          setNotifiedLayoutBudgets(newSet);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgets, transactions, selectedCurrency, addNotification, convertAmount, notifiedLayoutBudgets, getBudgetsByMonth, getTransactionsByCategoryAndMonth]);

  useEffect(() => {
    checkAndNotifyGlobalBudgets();
  }, [checkAndNotifyGlobalBudgets]);
  
  return null; // This component doesn't render anything
}


export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);


  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <CurrencyProvider>
        <TransactionProvider>
          <BudgetProvider>
            <BudgetNotificationEffect />
            <SidebarProvider defaultOpen>
              <Sidebar variant="sidebar" collapsible="icon" side="left" className="border-r">
                <SidebarHeader className="p-4 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 transition-all duration-200 ease-linear">
                  <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0 transition-all duration-200 ease-linear">
                    <AppLogo className="h-10 w-10 text-primary transition-all duration-200 ease-linear transform -translate-y-0.5" />
                    <span className="font-headline text-xl font-semibold whitespace-nowrap overflow-hidden transition-all duration-200 ease-linear group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0">
                      FinSight
                    </span>
                  </Link>
                </SidebarHeader>
                <SidebarContent>
                  <SidebarNav />
                </SidebarContent>
                <SidebarFooter className="p-4">
                  {/* You can add footer items like settings or help here */}
                </SidebarFooter>
              </Sidebar>
              <SidebarRail />
              <SidebarInset>
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger />
                  </div>

                  <div className="flex items-center gap-4">
                    <NotificationBell />
                    <UserNav />
                  </div>
                </header>

                {/* Page Content */}
                <AnimatePresence mode="wait">
                  <motion.main
                    key={pathname}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8"
                  >
                    {children}
                  </motion.main>
                </AnimatePresence>
              </SidebarInset>
            </SidebarProvider>
          </BudgetProvider>
        </TransactionProvider>
      </CurrencyProvider>
    </NotificationProvider>
  );
}
