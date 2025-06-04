
"use client";

import React from "react";
import { Bell, Trash2, MailOpen, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useNotification } from "@/contexts/notification-context";
import type { AppNotification } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { cn } from "@/lib/utils";

const getNotificationIcon = (type: AppNotification['type']) => {
  switch (type) {
    case 'error':
      return <Bell className="h-4 w-4 text-destructive" />;
    case 'warning':
      return <Bell className="h-4 w-4 text-yellow-500" />;
    case 'success':
      return <Bell className="h-4 w-4 text-green-500" />;
    case 'info':
    default:
      return <Bell className="h-4 w-4 text-primary" />;
  }
};


export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, clearNotificationById } = useNotification();

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // If notification.href, router.push(notification.href) can be added here
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
             <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
                Mark all as read
             </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled className="justify-center text-muted-foreground">
            No new notifications
          </DropdownMenuItem>
        ) : (
          <ScrollArea className="h-[300px]">
            <DropdownMenuGroup>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 hover:bg-accent/50 cursor-pointer data-[highlighted]:bg-accent/80",
                    !notification.read && "bg-accent/20 dark:bg-accent/10"
                  )}
                  onSelect={(e) => e.preventDefault()} 
                  asChild={!!notification.href}
                >
                  {notification.href ? (
                     <Link href={notification.href} onClick={() => handleNotificationClick(notification)} className="w-full flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <p className={cn("text-sm font-medium", !notification.read && "font-semibold")}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.description}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground/80">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                         <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 hover:opacity-100" onClick={(e) => {e.stopPropagation(); e.preventDefault(); clearNotificationById(notification.id);}}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                     </Link>
                  ) : (
                    <div className="w-full flex items-start gap-3" onClick={() => handleNotificationClick(notification)}>
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <p className={cn("text-sm font-medium", !notification.read && "font-semibold")}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.description}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground/80">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 hover:opacity-100" onClick={(e) => {e.stopPropagation(); clearNotificationById(notification.id);}}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </ScrollArea>
        )}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearNotifications} className="justify-center text-sm text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Clear all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
