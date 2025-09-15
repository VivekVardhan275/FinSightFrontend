
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ListChecks, 
  Target, 
  LineChart,
  Users
} from "lucide-react";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/transactions", label: "Transactions", icon: <ListChecks /> },
  { href: "/budgets", label: "Budgets", icon: <Target /> },
  { href: "/groups", label: "Groups", icon: <Users /> },
  { href: "/forecast", label: "Forecast", icon: <LineChart /> }, 
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              className={cn(item.disabled && "cursor-not-allowed opacity-50")}
              tooltip={item.label}
            >
              <a>
                {item.icon}
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
