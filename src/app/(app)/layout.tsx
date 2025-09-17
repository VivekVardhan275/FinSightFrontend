
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
import { usePathname } from "next/navigation";
import React, { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/contexts/currency-context";
import { useNotification } from "@/contexts/notification-context";
import { NotificationBell } from "@/components/layout/notification-bell";
import { TransactionProvider } from "@/contexts/transaction-context";
import { BudgetProvider, useBudgetContext } from "@/contexts/budget-context";
import { formatCurrency } from "@/lib/utils";
import { UserSettingsLoader } from "@/components/layout/user-settings-loader";
import type { AppNotification, Budget } from "@/types"; // Assuming Transaction might be needed if passed to calculate
import { GroupProvider } from "@/contexts/group-context";

function BudgetNotificationEffect() {
  const { budgets, getBudgetsByMonth } = useBudgetContext();
  const { addNotification } = useNotification();
  const { selectedCurrency, convertAmount } = useCurrency();
  const [notifiedLayoutBudgets, setNotifiedLayoutBudgets] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const storedNotified = localStorage.getItem('app-layout-notified-budgets');
      if (storedNotified) {
        setNotifiedLayoutBudgets(new Set(JSON.parse(storedNotified)));
      }
    } catch (e) {
      console.error("Error parsing layout notified budgets from localStorage", e);
      setNotifiedLayoutBudgets(new Set());
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('app-layout-notified-budgets', JSON.stringify(Array.from(notifiedLayoutBudgets)));
    } catch (e) {
      console.error("Error setting layout notified budgets to localStorage", e);
    }
  }, [notifiedLayoutBudgets]);

  const memoizedCalculateBudgetNotifications = useCallback(() => {
    const notificationsToDispatch: Array<Omit<AppNotification, 'id' | 'timestamp' | 'read'>> = [];
    const newPotentialNotifiedSet = new Set(notifiedLayoutBudgets);
    let setContentHasChanged = false;

    if (!budgets || budgets.length === 0) {
      if (notifiedLayoutBudgets.size > 0) {
        newPotentialNotifiedSet.clear();
        setContentHasChanged = true;
      }
      return { notificationsToDispatch, nextNotifiedSet: newPotentialNotifiedSet, setContentHasChanged };
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const relevantBudgets = getBudgetsByMonth(currentYear, currentMonth);

    relevantBudgets.forEach(budget => {
      const currentSpentINR = budget.spent;
      const allocatedINR = budget.allocated;
      const percentageSpent = allocatedINR > 0 ? (currentSpentINR / allocatedINR) * 100 : 0;
      const budgetId = budget.id;

      const displaySpent = convertAmount(currentSpentINR, selectedCurrency);
      const displayAllocated = convertAmount(allocatedINR, selectedCurrency);

      const exceededKey = `layout-${budgetId}-exceeded`;
      const nearingKey = `layout-${budgetId}-nearing`;

      if (currentSpentINR > allocatedINR) {
        if (!notifiedLayoutBudgets.has(exceededKey)) {
          notificationsToDispatch.push({
            title: "Budget Exceeded!",
            description: `You've exceeded budget for ${budget.category} (${budget.month}). Spent: ${formatCurrency(displaySpent, selectedCurrency)}, Allocated: ${formatCurrency(displayAllocated, selectedCurrency)}.`,
            type: "error",
            href: "/budgets"
          });
          if (!newPotentialNotifiedSet.has(exceededKey)) { newPotentialNotifiedSet.add(exceededKey); }
          if (newPotentialNotifiedSet.has(nearingKey)) { newPotentialNotifiedSet.delete(nearingKey); }
          // setContentHasChanged will be determined later by comparing sets
        }
      } else if (percentageSpent >= 85) {
        if (!notifiedLayoutBudgets.has(nearingKey) && !notifiedLayoutBudgets.has(exceededKey)) {
          notificationsToDispatch.push({
            title: "Budget Nearing Limit",
            description: `Spent ${percentageSpent.toFixed(0)}% of budget for ${budget.category} (${budget.month}). Spent: ${formatCurrency(displaySpent, selectedCurrency)}, Allocated: ${formatCurrency(displayAllocated, selectedCurrency)}.`,
            type: "warning",
            href: "/budgets"
          });
          if (!newPotentialNotifiedSet.has(nearingKey)) { newPotentialNotifiedSet.add(nearingKey); }
        }
      } else {
        if (newPotentialNotifiedSet.has(nearingKey)) {
          newPotentialNotifiedSet.delete(nearingKey);
        }
        if (newPotentialNotifiedSet.has(exceededKey)) {
          newPotentialNotifiedSet.delete(exceededKey);
        }
      }
    });
    
    if (notifiedLayoutBudgets.size !== newPotentialNotifiedSet.size) {
        setContentHasChanged = true;
    } else {
        for (const item of newPotentialNotifiedSet) {
            if (!notifiedLayoutBudgets.has(item)) {
                setContentHasChanged = true;
                break;
            }
        }
        if (!setContentHasChanged) { // Check other direction if sizes are same and no new items found
             for (const item of notifiedLayoutBudgets) {
                if (!newPotentialNotifiedSet.has(item)) {
                    setContentHasChanged = true;
                    break;
                }
            }
        }
    }

    return { notificationsToDispatch, nextNotifiedSet: newPotentialNotifiedSet, setContentHasChanged };
  }, [budgets, getBudgetsByMonth, convertAmount, selectedCurrency, notifiedLayoutBudgets]);


  useEffect(() => {
    const { notificationsToDispatch, nextNotifiedSet, setContentHasChanged } = memoizedCalculateBudgetNotifications();

    if (notificationsToDispatch.length > 0) {
      notificationsToDispatch.forEach(notifData => {
        addNotification(notifData);
      });
    }

    if (setContentHasChanged) {
      setNotifiedLayoutBudgets(nextNotifiedSet);
    }
  }, [memoizedCalculateBudgetNotifications, addNotification]);
  
  return null;
}

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authStateIsLoading, status } = useAuthState();
  const pathname = usePathname();

  if (authStateIsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p>Loading application...</p>
      </div>
    );
  }
  
  if (status !== 'authenticated' || (status === 'authenticated' && user?.hasCompletedSetup !== true)) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
          <p>Redirecting...</p>
        </div>
    );
  }
  
  return (
    <TransactionProvider>
      <BudgetProvider>
        <GroupProvider>
          <UserSettingsLoader />
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
        </GroupProvider>
      </BudgetProvider>
    </TransactionProvider>
  );
}
