
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { Palette, Globe, Save, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import { useCurrency, type Currency as AppCurrency } from "@/contexts/currency-context";
import { useAuthState } from "@/hooks/use-auth-state";
import axios from "axios";

const SETTINGS_API_URL = "http://localhost:8080/api/user/settings"; // Keep for potential save later

const pageHeaderBlockMotionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const cardMotionVariants = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay } },
});

type ThemeSetting = "light" | "dark" | "system";
type FontSizeSetting = "small" | "medium" | "large";

const FONT_SIZE_CLASSES: Record<FontSizeSetting, string> = {
  small: "font-size-small",
  medium: "font-size-medium",
  large: "font-size-large",
};

const initializeFromLocalStorage = <T,>(
  key: string,
  defaultValue: T,
  validator?: (value: any) => boolean,
  parser?: (storedValue: string) => T
): T => {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue !== null) {
      const parsedValue = parser ? parser(storedValue) : (storedValue as unknown as T);
      if (validator ? validator(parsedValue) : true) {
        return parsedValue;
      }
    }
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
  }
  return defaultValue;
};


export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuthState();
  const { theme: activeTheme, setTheme } = useTheme(); // activeTheme is from next-themes
  const { toast } = useToast();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  // Local form states, initialized from localStorage or context
  const [currentTheme, setCurrentTheme] = useState<ThemeSetting>(() =>
    initializeFromLocalStorage<ThemeSetting>("app-theme", "system", (v) =>
      ["light", "dark", "system"].includes(v)
    )
  );
  const [fontSize, setFontSize] = useState<FontSizeSetting>(() =>
    initializeFromLocalStorage<FontSizeSetting>("app-font-size", "medium", (v) =>
      !!FONT_SIZE_CLASSES[v as FontSizeSetting]
    )
  );
  // Local selectedCurrency is now primarily driven by useCurrency hook
  // For the form, we can just use selectedCurrency directly from the context for display
  // and setSelectedCurrency for updates.

  const [isSettingsLoading, setIsSettingsLoading] = useState(true); // To manage perceived loading

  // API call for fetching initial settings has been removed.
  // UserSettingsLoader handles this. This page reflects already loaded settings.
  useEffect(() => {
    // If auth is still loading, or user details are not yet available,
    // settings might not be fully loaded by UserSettingsLoader.
    // We simply mark settings as "loaded" for this page once auth is resolved.
    if (!authLoading) {
      setIsSettingsLoading(false);
      // Re-sync local form theme state if UserSettingsLoader might have updated it via setTheme
      const storedAppTheme = localStorage.getItem("app-theme") as ThemeSetting | null;
      if (storedAppTheme && storedAppTheme !== currentTheme) {
          setCurrentTheme(storedAppTheme);
      }
       // Re-sync local font size state if UserSettingsLoader might have updated it
      const storedFontSize = localStorage.getItem("app-font-size") as FontSizeSetting | null;
      if (storedFontSize && FONT_SIZE_CLASSES[storedFontSize] && storedFontSize !== fontSize) {
          setFontSize(storedFontSize);
      }
    }
  }, [authLoading, currentTheme, fontSize]);


  // Effect to align local currentTheme with next-themes' activeTheme IF `app-theme` (our localStorage key)
  // was not set AND activeTheme is valid. This is mostly for initial hydration or system changes.
  useEffect(() => {
    const storedAppTheme = localStorage.getItem("app-theme");
    if (!storedAppTheme && activeTheme && ["light", "dark", "system"].includes(activeTheme)) {
      // Only update local state if it's different, to prevent potential loops
      if (currentTheme !== activeTheme) {
        setCurrentTheme(activeTheme as ThemeSetting);
      }
    }
  }, [activeTheme, currentTheme]); // Added currentTheme dependency

  // Persist theme to localStorage AND apply using next-themes when currentTheme (local form state) changes.
  useEffect(() => {
    localStorage.setItem("app-theme", currentTheme);
    if (activeTheme !== currentTheme) { // Apply only if different from what next-themes already has
        setTheme(currentTheme);
    }
  }, [currentTheme, setTheme, activeTheme]);

  // Persist font size to localStorage AND apply to HTML element when fontSize (local form state) changes.
  useEffect(() => {
    localStorage.setItem("app-font-size", fontSize);
    const htmlElement = document.documentElement;
    Object.values(FONT_SIZE_CLASSES).forEach(cls => htmlElement.classList.remove(cls));
    if (FONT_SIZE_CLASSES[fontSize]) {
      htmlElement.classList.add(FONT_SIZE_CLASSES[fontSize]);
    }
  }, [fontSize]);

  // Currency is managed by CurrencyProvider, which handles localStorage.
  // The Select component for currency will use `selectedCurrency` from context for its value
  // and `setSelectedCurrency` from context for its onValueChange.

  const handleSaveSettings = async () => {
    if (!user || !user.email) {
        toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
        return;
    }
    // This function will save to localStorage (already done by useEffects)
    // AND make an API call to save settings to the backend.
    // For now, local changes are immediately applied by useEffects.

    // TODO: Implement PUT request to backend here.
    // Example payload for backend:
    const settingsToSave = {
      theme: currentTheme,
      fontSize: fontSize,
      currency: selectedCurrency, // from useCurrency context
    };

    try {
      // Simulate API call for now or implement actual axios.put
      // await axios.put(`${SETTINGS_API_URL}?email=${encodeURIComponent(user.email)}`, settingsToSave);
      
      // Since local changes are already applied by useEffects,
      // we just need to confirm to the user.
      localStorage.setItem("app-theme", currentTheme);
      localStorage.setItem("app-font-size", fontSize);
      // selectedCurrency is already updated in context and localStorage by setSelectedCurrency

      toast({
        title: "Settings Applied",
        description: "Your preferences have been updated locally. Backend save is conceptual.",
      });
    } catch (error) {
      console.error("Error saving settings to backend (conceptual):", error);
      toast({
        title: "Error Saving Settings",
        description: "Could not save preferences to the server. Local changes applied.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isSettingsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RotateCw className="mr-2 h-6 w-6 animate-spin text-primary" />
        <p>Loading settings...</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <motion.div
        initial="initial"
        animate="animate"
        variants={pageHeaderBlockMotionVariants}
        viewport={{ once: true }}
      >
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Customize your application experience.
        </p>
      </motion.div>

      <motion.div initial="initial" animate="animate" variants={cardMotionVariants(0.1)} viewport={{ once: true }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center font-headline">
              <Palette className="mr-2 h-6 w-6 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Adjust how the application looks and feels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme-select">Theme</Label>
              <Select value={currentTheme} onValueChange={(value: string) => setCurrentTheme(value as ThemeSetting)}>
                <SelectTrigger id="theme-select">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Font Size</Label>
              <RadioGroup value={fontSize} onValueChange={(value: string) => setFontSize(value as FontSizeSetting)} className="flex space-x-4">
                <div>
                  <RadioGroupItem value="small" id="font-small" />
                  <Label htmlFor="font-small" className="ml-2 cursor-pointer">Small</Label>
                </div>
                <div>
                  <RadioGroupItem value="medium" id="font-medium" />
                  <Label htmlFor="font-medium" className="ml-2 cursor-pointer">Medium</Label>
                </div>
                <div>
                  <RadioGroupItem value="large" id="font-large" />
                  <Label htmlFor="font-large" className="ml-2 cursor-pointer">Large</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial="initial" animate="animate" variants={cardMotionVariants(0.2)} viewport={{ once: true }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center font-headline">
              <Globe className="mr-2 h-6 w-6 text-primary" />
              Regional
            </CardTitle>
            <CardDescription>Set your currency and other regional formats.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currency-select">Currency</Label>
              <Select value={selectedCurrency} onValueChange={(value: string) => setSelectedCurrency(value as AppCurrency)}>
                <SelectTrigger id="currency-select">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                  <SelectItem value="USD">USD - United States Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">Date format, number format, and time zone settings will be available in a future update.</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial="initial" animate="animate" variants={cardMotionVariants(0.4)} className="flex justify-end pt-4" viewport={{ once: true }}>
        <Button onClick={handleSaveSettings} size="lg">
          <Save className="mr-2 h-5 w-5" />
          Save All Settings
        </Button>
      </motion.div>
    </div>
  );
}
