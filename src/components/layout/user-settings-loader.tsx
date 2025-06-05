
"use client";

import React, { useEffect, useState, useCallback } from 'react';
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

// Flag to ensure settings are fetched only once per session/user login
let initialSettingsFetchedForSession = false;

export function UserSettingsLoader() {
  const { user, status } = useAuthState();
  const { setTheme } = useTheme();
  const { setSelectedCurrency } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);

  const applyFontSize = useCallback((fontSize: FontSizeSetting) => {
    localStorage.setItem("app-font-size", fontSize);
    const htmlElement = document.documentElement;
    Object.values(FONT_SIZE_CLASSES).forEach(cls => htmlElement.classList.remove(cls));
    if (FONT_SIZE_CLASSES[fontSize]) {
      htmlElement.classList.add(FONT_SIZE_CLASSES[fontSize]);
    } else {
      // Fallback to medium if an invalid size is somehow fetched
      htmlElement.classList.add(FONT_SIZE_CLASSES.medium);
      localStorage.setItem("app-font-size", "medium");
    }
  }, []);

  useEffect(() => {
    if (
      status === 'authenticated' &&
      user?.email &&
      user?.hasCompletedSetup === true && // Ensure setup is complete
      !initialSettingsFetchedForSession &&
      !isLoading
    ) {
      setIsLoading(true);
      initialSettingsFetchedForSession = true; // Set flag immediately to prevent re-fetch attempts

      axios.get(`${SETTINGS_API_URL}?email=${encodeURIComponent(user.email)}`)
        .then(response => {
          const fetchedSettings = response.data;

          if (fetchedSettings.theme && ["light", "dark", "system"].includes(fetchedSettings.theme)) {
            setTheme(fetchedSettings.theme as ThemeSetting);
          }
          if (fetchedSettings.fontSize && FONT_SIZE_CLASSES[fetchedSettings.fontSize as FontSizeSetting]) {
            applyFontSize(fetchedSettings.fontSize as FontSizeSetting);
          }
          if (fetchedSettings.currency) {
            setSelectedCurrency(fetchedSettings.currency as AppCurrency);
          }
          // console.log("User settings applied from UserSettingsLoader");
        })
        .catch(error => {
          console.error("UserSettingsLoader: Error fetching user settings:", error);
          // Fallback to defaults or localStorage is implicitly handled by individual context providers / root layout
          initialSettingsFetchedForSession = false; // Allow retry if fetch failed, e.g. on next login.
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status === 'unauthenticated') {
        // Reset flag if user logs out
        initialSettingsFetchedForSession = false;
    }
  }, [user, status, setTheme, setSelectedCurrency, applyFontSize, isLoading]);

  // This component does not render anything itself
  return null;
}
