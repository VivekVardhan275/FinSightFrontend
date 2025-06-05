
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
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/contexts/currency-context";
import { useNotification } from "@/contexts/notification-context";
import { NotificationBell } from "@/components/layout/notification-bell";
import { TransactionProvider, useTransactionContext } from "@/contexts/transaction-context";
import { BudgetProvider, useBudgetContext } from "@/contexts/budget-context";
import { formatCurrency } from "@/lib/utils";


function BudgetNotificationEffect() {
  const { budgets, getBudgetsByMonth } = useBudgetContext();
  const { transactions, getTransactionsByCategoryAndMonth } = useTransactionContext();
  const { addNotification } = useNotification();
  const { selectedCurrency, convertAmount } = useCurrency();
  const [notifiedLayoutBudgets, setNotifiedLayoutBudgets] = React.useState<Set<string>>(new Set());

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
    const currentMonth = currentDate.getMonth() + 1; 

    const currentMonthBudgets = getBudgetsByMonth(currentYear, currentMonth);

    currentMonthBudgets.forEach(budget => {
      const budgetTransactions = getTransactionsByCategoryAndMonth(budget.category.toLowerCase(), currentYear, currentMonth);
      const currentSpent = budget.spent; 

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
            newSet.delete(nearingKey); 
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
    // This useEffect handles redirection for setup completion status if the user is authenticated.
    // Redirection for unauthenticated users is handled by useAuthState.
    if (status === 'authenticated') {
      const hasCompletedSetup = localStorage.getItem('foresight_hasCompletedSetup') === 'true';
      if (!hasCompletedSetup && pathname !== '/welcome/setup') {
         console.log("AuthenticatedAppLayout: User authenticated, setup not complete, redirecting to /welcome/setup");
         router.replace('/welcome/setup');
      } else if (hasCompletedSetup && pathname === '/welcome/setup') {
         console.log("AuthenticatedAppLayout: User authenticated, setup complete, but on setup page, redirecting to /dashboard");
         router.replace('/dashboard');
      }
    }
  }, [status, pathname, router]);


  if (isLoading || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p>Loading application...</p>
      </div>
    );
  }
  
  // If not authenticated and not loading, useAuthState hook should handle the redirect.
  // This layout shows a placeholder message.
  if (status === 'unauthenticated' && pathname !== '/welcome/setup') { // Allow setup page to handle its own auth check
     console.warn("AuthenticatedAppLayout: Unauthenticated. Redirect should be handled by useAuthState.");
     // router.replace('/login'); // REMOVED: This was causing the error. useAuthState handles this.
     return (
        <div className="flex h-screen items-center justify-center bg-background">
          <p>Redirecting to login...</p>
        </div>
     );
  }

  // If authenticated but setup is not complete, and current path is not the setup page,
  // the useEffect above will handle the redirect. This shows a placeholder.
  if (status === 'authenticated') {
    const hasCompletedSetup = localStorage.getItem('foresight_hasCompletedSetup') === 'true';
    if (!hasCompletedSetup && pathname !== '/welcome/setup') {
       return (
        <div className="flex h-screen items-center justify-center bg-background">
          <p>Redirecting to setup...</p>
        </div>
      );
    }
  }


  return (
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
  );
}
