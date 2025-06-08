
"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthState } from '@/hooks/use-auth-state';
import { useTheme } from 'next-themes';
import { useCurrency, type Currency as AppCurrency } from '@/contexts/currency-context';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const SETTINGS_API_URL = `${backendUrl}/api/user/settings`;

const addRandomQueryParam = (url: string, paramName: string = '_cb'): string => {
  const randomString = Math.random().toString(36).substring(2, 10);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${paramName}=${randomString}`;
};

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
      try {
        localStorage.setItem("app-font-size", fontSize);
        const htmlElement = document.documentElement;
        Object.values(FONT_SIZE_CLASSES).forEach(cls => htmlElement.classList.remove(cls));
        if (FONT_SIZE_CLASSES[fontSize]) {
          htmlElement.classList.add(FONT_SIZE_CLASSES[fontSize]);
        } else {
          htmlElement.classList.add(FONT_SIZE_CLASSES.medium);
          localStorage.setItem("app-font-size", "medium");
        }
      } catch (error) {
        console.error("UserSettingsLoader: Error applying font size or saving to localStorage", error);
        const htmlElement = document.documentElement;
        Object.values(FONT_SIZE_CLASSES).forEach(cls => htmlElement.classList.remove(cls));
        htmlElement.classList.add(FONT_SIZE_CLASSES.medium);
      }
    }
  }, []);

  const userEmail = user?.email; 

  useEffect(() => {
    if (status === 'authenticated' && userEmail && user?.hasCompletedSetup === true) {
      if (settingsFetchedForUserRef.current !== userEmail && !isFetchingSettings) {
        setIsFetchingSettings(true);
        settingsFetchedForUserRef.current = userEmail;

        const apiUrl = `${SETTINGS_API_URL}?email=${encodeURIComponent(userEmail)}`;
        axios.get(addRandomQueryParam(apiUrl))
          .then(response => {
            const fetchedSettings = response.data;

            if (fetchedSettings.theme && ["light", "dark", "system"].includes(fetchedSettings.theme)) {
              setTheme(fetchedSettings.theme as ThemeSetting);
              try {
                localStorage.setItem("app-theme", fetchedSettings.theme);
              } catch (e) {
                console.error("UserSettingsLoader: Error saving theme to localStorage", e);
              }
            }
            if (fetchedSettings.fontSize && FONT_SIZE_CLASSES[fetchedSettings.fontSize as FontSizeSetting]) {
              applyFontSize(fetchedSettings.fontSize as FontSizeSetting);
            }
            if (fetchedSettings.currency) {
              setSelectedCurrency(fetchedSettings.currency as AppCurrency);
            }
          })
          .catch(error => {
            console.error("API error fetching user settings.");
            if (axios.isAxiosError(error) && error.response) {
                console.error("Backend error message:", error.response.data?.message || error.response.data?.error || "No specific message from backend.");
                console.error("Status code:", error.response.status);
            } else if (error instanceof Error) {
                console.error("Error details:", error.message);
            }
            settingsFetchedForUserRef.current = null; 
          })
          .finally(() => {
            setIsFetchingSettings(false);
          });
      }
    } else if (status === 'unauthenticated') {
        settingsFetchedForUserRef.current = null;
        if (isFetchingSettings) setIsFetchingSettings(false); 
    }
  }, [userEmail, status, user?.hasCompletedSetup, setTheme, setSelectedCurrency, applyFontSize, isFetchingSettings]);

  return null;
}
