
"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthState } from '@/hooks/use-auth-state';
import { useTheme } from 'next-themes';
import { useCurrency, type Currency as AppCurrency } from '@/contexts/currency-context';
import axios from 'axios';

const SETTINGS_API_URL = "http://localhost:8080/api/user/settings";

type ThemeSetting = "light" | "dark" | "system";
type FontSizeSetting = "small" | "medium" | "large";

const FONT_SIZE_CLASSES: Record<FontSizeSetting, string> = {
  small: "font-size-small",
  medium: "font-size-medium",
  large: "font-size-large",
};

export function UserSettingsLoader() {
  const { user, status } = useAuthState();
  const { setTheme } = useTheme();
  const { setSelectedCurrency } = useCurrency();
  const [isFetchingSettings, setIsFetchingSettings] = useState(false);
  const settingsFetchedForUserRef = useRef<string | null>(null);

  const applyFontSize = useCallback((fontSize: FontSizeSetting) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("app-font-size", fontSize);
        const htmlElement = document.documentElement;
        Object.values(FONT_SIZE_CLASSES).forEach(cls => htmlElement.classList.remove(cls));
        if (FONT_SIZE_CLASSES[fontSize]) {
          htmlElement.classList.add(FONT_SIZE_CLASSES[fontSize]);
        } else {
          htmlElement.classList.add(FONT_SIZE_CLASSES.medium);
          localStorage.setItem("app-font-size", "medium");
        }
    }
  }, []);

  const userEmail = user?.email; // Stable variable for user's email

  useEffect(() => {
    if (status === 'authenticated' && userEmail && user?.hasCompletedSetup === true) {
      // Only fetch if not already fetched for this user AND not currently fetching
      if (settingsFetchedForUserRef.current !== userEmail && !isFetchingSettings) {
        setIsFetchingSettings(true);
        settingsFetchedForUserRef.current = userEmail;

        axios.get(`${SETTINGS_API_URL}?email=${encodeURIComponent(userEmail)}`)
          .then(response => {
            const fetchedSettings = response.data;

            if (fetchedSettings.theme && ["light", "dark", "system"].includes(fetchedSettings.theme)) {
              setTheme(fetchedSettings.theme as ThemeSetting);
              localStorage.setItem("app-theme", fetchedSettings.theme);
            }
            if (fetchedSettings.fontSize && FONT_SIZE_CLASSES[fetchedSettings.fontSize as FontSizeSetting]) {
              applyFontSize(fetchedSettings.fontSize as FontSizeSetting);
            }
            if (fetchedSettings.currency) {
              setSelectedCurrency(fetchedSettings.currency as AppCurrency);
              localStorage.setItem("app-currency", fetchedSettings.currency);
            }
          })
          .catch(error => {
            console.error("UserSettingsLoader: Error fetching user settings:", error);
            settingsFetchedForUserRef.current = null; // Allow retry on error for this user
          })
          .finally(() => {
            setIsFetchingSettings(false);
          });
      }
    } else if (status === 'unauthenticated') {
        settingsFetchedForUserRef.current = null;
        if (isFetchingSettings) setIsFetchingSettings(false); // Reset if user logs out during fetch
    }
  // Removed isFetchingSettings from dependencies.
  // Dependencies are now userEmail, status, user?.hasCompletedSetup, and stable functions.
  }, [userEmail, status, user?.hasCompletedSetup, setTheme, setSelectedCurrency, applyFontSize]);

  return null;
}
