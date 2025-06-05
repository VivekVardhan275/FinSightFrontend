
"use client"; // Required for useEffect

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import React, { useEffect } from 'react'; // Import useEffect
import { Inter } from 'next/font/google';
import { CurrencyProvider } from "@/contexts/currency-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { SessionProvider } from "next-auth/react"; // Import SessionProvider

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Font size constants
const FONT_SIZE_CLASSES = {
  small: "font-size-small",
  medium: "font-size-medium",
  large: "font-size-large",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const htmlElement = document.documentElement;

    // Apply font size
    const storedFontSize = localStorage.getItem("app-font-size") as keyof typeof FONT_SIZE_CLASSES | null;
    Object.values(FONT_SIZE_CLASSES).forEach(cls => htmlElement.classList.remove(cls));
    if (storedFontSize && FONT_SIZE_CLASSES[storedFontSize]) {
      htmlElement.classList.add(FONT_SIZE_CLASSES[storedFontSize]);
    } else {
      htmlElement.classList.add(FONT_SIZE_CLASSES.medium); // Default
    }

  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Removed preconnect links for Google Fonts as next/font handles it */}
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <SessionProvider> {/* Wrap with SessionProvider */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NotificationProvider>
              <CurrencyProvider>
                {children}
                <Toaster />
              </CurrencyProvider>
            </NotificationProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
