
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
import { usePathname } from "next/navigation"; // Removed useRouter
import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/contexts/currency-context";
import { useNotification } from "@/contexts/notification-context";
import { NotificationBell } from "@/components/layout/notification-bell";
import { TransactionProvider } from "@/contexts/transaction-context";
import { BudgetProvider, useBudgetContext } from "@/contexts/budget-context";
import { formatCurrency } from "@/lib/utils";
import { UserSettingsLoader } from "@/components/layout/user-settings-loader";

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
        // console.error("Error parsing layout notified budgets from localStorage", e);
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
    const currentMonth = currentDate.getMonth() + 1;

    const currentMonthBudgets = getBudgetsByMonth(currentYear, currentMonth);

    setNotifiedLayoutBudgets(prevNotifiedSet => {
      let newSet = new Set(prevNotifiedSet);
      let changed = false;

      currentMonthBudgets.forEach(budget => {
        const currentSpentINR = budget.spent;
        const allocatedINR = budget.allocated;
        const percentageSpent = allocatedINR > 0 ? (currentSpentINR / allocatedINR) * 100 : 0;
        const budgetId = budget.id;

        const displaySpent = convertAmount(currentSpentINR, selectedCurrency);
        const displayAllocated = convertAmount(allocatedINR, selectedCurrency);

        const exceededKey = `layout-${budgetId}-exceeded`;
        const nearingKey = `layout-${budgetId}-nearing`;

        if (currentSpentINR > allocatedINR) {
          if (!prevNotifiedSet.has(exceededKey)) {
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
        } else if (percentageSpent >= 85) {
          if (!prevNotifiedSet.has(nearingKey) && !prevNotifiedSet.has(exceededKey)) {
            addNotification({
              title: "Budget Nearing Limit",
              description: `Spent ${percentageSpent.toFixed(0)}% of budget for ${budget.category} (${budget.month}). Spent: ${formatCurrency(displaySpent, selectedCurrency)}, Allocated: ${formatCurrency(displayAllocated, selectedCurrency)}.`,
              type: "warning",
              href: "/budgets"
            });
            newSet.add(nearingKey);
            changed = true;
          }
        } else {
          if (prevNotifiedSet.has(nearingKey)) {
            newSet.delete(nearingKey);
            changed = true;
          }
          if (prevNotifiedSet.has(exceededKey)) {
            newSet.delete(exceededKey);
            changed = true;
          }
        }
      });

      if (changed) {
        return newSet;
      }
      return prevNotifiedSet;
    });
  }, [budgets, getBudgetsByMonth, convertAmount, selectedCurrency, addNotification, formatCurrency]);

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
  const { user, isLoading: authStateIsLoading, status } = useAuthState();
  const pathname = usePathname();

  // The useAuthState hook now handles the primary redirection logic.
  // This layout component focuses on rendering based on the resolved state.

  if (authStateIsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p>Loading application...</p> {/* Covers initial session load AND first-check API call duration */}
      </div>
    );
  }
  
  // If not authenticated, or authenticated but setup is not complete,
  // useAuthState will redirect. This layout should not render its main content in those cases.
  // This implicitly means if we proceed, status === 'authenticated' && user.hasCompletedSetup === true.
  if (status !== 'authenticated' || (status === 'authenticated' && user?.hasCompletedSetup !== true)) {
    // This state should typically lead to a redirect by useAuthState.
    // Rendering null here prevents brief flashes of layout content on unauthorized access.
    // Pages like /login or /welcome/setup are not wrapped by this layout.
    return (
        <div className="flex h-screen items-center justify-center bg-background">
          <p>Redirecting...</p> {/* Generic redirect message */}
        </div>
    );
  }
  
  // At this point, user is authenticated and setup is complete.
  return (
    <TransactionProvider>
      <BudgetProvider>
        <UserSettingsLoader /> {/* Fetches and applies settings */}
        <BudgetNotificationEffect /> {/* Handles budget notifications */}
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
              {/* Footer items can go here */}
            </SidebarFooter>
          </Sidebar>
          <SidebarRail />
          <SidebarInset>
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <UserNav />
              </div>
            </header>
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
