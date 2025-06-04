
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
import { CurrencyProvider } from "@/contexts/currency-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { NotificationBell } from "@/components/layout/notification-bell";

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
      </CurrencyProvider>
    </NotificationProvider>
  );
}
