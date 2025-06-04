"use client"; // Required for useEffect

import type { Metadata } from 'next'; // Keep if you still want static metadata
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import React, { useEffect } from 'react'; // Import useEffect

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Font size and compact mode constants
const FONT_SIZE_CLASSES = {
  small: "font-size-small",
  medium: "font-size-medium",
  large: "font-size-large",
};
const COMPACT_MODE_CLASS = "compact-mode";


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

    // Apply compact mode
    const storedCompactMode = localStorage.getItem("app-compact-mode");
    if (storedCompactMode === "true") {
      htmlElement.classList.add(COMPACT_MODE_CLASS);
    } else {
      htmlElement.classList.remove(COMPACT_MODE_CLASS);
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Removed preconnect links for Google Fonts as next/font handles it */}
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
