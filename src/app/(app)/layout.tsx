
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
import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/contexts/currency-context";
import { useNotification } from "@/contexts/notification-context";
import { NotificationBell } from "@/components/layout/notification-bell";
import { TransactionProvider, useTransactionContext } from "@/contexts/transaction-context";
import { BudgetProvider, useBudgetContext } from "@/contexts/budget-context";
import { formatCurrency } from "@/lib/utils";
import { UserSettingsLoader } from "@/components/layout/user-settings-loader"; // Import the new loader

function BudgetNotificationEffect() {
  const { budgets, getBudgetsByMonth } = useBudgetContext();
  const { addNotification } = useNotification();
  const { selectedCurrency, convertAmount } = useCurrency();
  const [notifiedLayoutBudgets, setNotifiedLayoutBudgets] = React.useState<Set<string>>(new Set());

  useEffect(() => {
    const storedNotified = localStorage.getItem('app-layout-notified-budgets');
    if (storedNotified) {
      try {
        setNotifiedLayoutBudgets(new Set(JSON.parse(storedNotified)));
      } catch (e) {
        // console.error("Error parsing layout notified budgets from localStorage", e); // Keep console clean
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app-layout-notified-budgets', JSON.stringify(Array.from(notifiedLayoutBudgets)));
  }, [notifiedLayoutBudgets]);

  const checkAndNotifyGlobalBudgets = useCallback(() => {
    if (!budgets || budgets.length === 0) return;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-indexed

    const currentMonthBudgets = getBudgetsByMonth(currentYear, currentMonth);

    currentMonthBudgets.forEach(budget => {
      const currentSpentUSD = budget.spent;
      const allocatedUSD = budget.allocated;
      const percentageSpent = allocatedUSD > 0 ? (currentSpentUSD / allocatedUSD) * 100 : 0;
      const budgetId = budget.id;

      const displaySpent = convertAmount(currentSpentUSD, selectedCurrency);
      const displayAllocated = convertAmount(allocatedUSD, selectedCurrency);

      const exceededKey = `layout-${budgetId}-exceeded`;
      const nearingKey = `layout-${budgetId}-nearing`; // Nearing 85%

      let newSet = new Set(notifiedLayoutBudgets);
      let changed = false;

      if (currentSpentUSD > allocatedUSD) { // Exceeded
        if (!notifiedLayoutBudgets.has(exceededKey)) {
          addNotification({
            title: "Budget Exceeded!",
            description: `You've exceeded budget for ${budget.category} (${budget.month}). Spent: ${formatCurrency(displaySpent, selectedCurrency)}, Allocated: ${formatCurrency(displayAllocated, selectedCurrency)}.`,
            type: "error",
            href: "/budgets"
          });
          newSet.add(exceededKey);
          if (newSet.has(nearingKey)) newSet.delete(nearingKey);
          changed = true;
        }
      } else if (percentageSpent >= 85) { // Nearing limit (but not exceeded)
        if (!notifiedLayoutBudgets.has(nearingKey) && !notifiedLayoutBudgets.has(exceededKey)) {
          addNotification({
            title: "Budget Nearing Limit",
            description: `Spent ${percentageSpent.toFixed(0)}% of budget for ${budget.category} (${budget.month}). Spent: ${formatCurrency(displaySpent, selectedCurrency)}, Allocated: ${formatCurrency(displayAllocated, selectedCurrency)}.`,
            type: "warning",
            href: "/budgets"
          });
          newSet.add(nearingKey);
          changed = true;
        }
      } else { // Neither exceeded nor nearing 85% - reset notification state for this budget
        if (newSet.has(nearingKey)) {
          newSet.delete(nearingKey);
          changed = true;
        }
        if (newSet.has(exceededKey)) {
          newSet.delete(exceededKey);
          changed = true;
        }
      }

      if (changed) {
        setNotifiedLayoutBudgets(newSet);
      }
    });
  }, [budgets, notifiedLayoutBudgets, getBudgetsByMonth, convertAmount, selectedCurrency, addNotification, formatCurrency]);

  useEffect(() => {
    checkAndNotifyGlobalBudgets();
  }, [budgets, selectedCurrency, checkAndNotifyGlobalBudgets]);
  
  return null;
}

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, status } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || status === 'loading') return; 

    const setupCompleted = user?.hasCompletedSetup === true;

    if (status === 'authenticated') {
      if (setupCompleted) {
        if (pathname === '/login' || pathname === '/welcome/setup') {
          router.replace('/dashboard');
        }
      } else {
        if (pathname !== '/welcome/setup') {
          router.replace('/welcome/setup');
        }
      }
    } else if (status === 'unauthenticated') {
      if (pathname !== '/login' && pathname !== '/welcome/setup') { 
        router.replace('/login');
      }
    }
  }, [user, isLoading, status, pathname, router]);


  if (isLoading || status === 'loading' || (status === 'authenticated' && user?.hasCompletedSetup === undefined) ) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p>Loading application...</p>
      </div>
    );
  }
  
  if (status === 'unauthenticated' && pathname !== '/login' && pathname !== '/welcome/setup') {
     return (
        <div className="flex h-screen items-center justify-center bg-background">
          <p>Redirecting to login...</p>
        </div>
     );
  }

  if (status === 'authenticated' && !user?.hasCompletedSetup && pathname !== '/welcome/setup') {
       return (
        <div className="flex h-screen items-center justify-center bg-background">
          <p>Redirecting to setup...</p>
        </div>
      );
  }

  if ((pathname === '/login' || pathname === '/welcome/setup') && status === 'authenticated' && user?.hasCompletedSetup) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
          <p>Redirecting to dashboard...</p>
        </div>
      );
  }
  
  return (
    <TransactionProvider>
      <BudgetProvider>
        {/* UserSettingsLoader will fetch and apply settings if user is authenticated and setup is complete */}
        {isAuthenticated && user?.hasCompletedSetup && <UserSettingsLoader />}
        {isAuthenticated && user?.hasCompletedSetup && <BudgetNotificationEffect />}
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
                {isAuthenticated && user?.hasCompletedSetup && <NotificationBell />}
                {isAuthenticated && <UserNav />}
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
  );
}
