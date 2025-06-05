
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { Palette, Globe, Save, User as UserIconLucide } from "lucide-react";
import { motion } from "framer-motion";
import { useCurrency, type Currency as AppCurrency } from "@/contexts/currency-context";

const pageHeaderBlockMotionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5 } }, // Delay removed
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

// Helper to initialize state from localStorage
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
  const { theme: activeTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  // Appearance
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

  // Effect to align currentTheme with next-themes' activeTheme if "app-theme" was not initially set from localStorage
  useEffect(() => {
    const storedAppTheme = localStorage.getItem("app-theme");
    if (!storedAppTheme && activeTheme && ["light", "dark", "system"].includes(activeTheme)) {
      setCurrentTheme(activeTheme as ThemeSetting);
    }
  }, [activeTheme]);

  // Persist settings to localStorage AND apply them whenever they change
  useEffect(() => {
    localStorage.setItem("app-theme", currentTheme);
    setTheme(currentTheme);
  }, [currentTheme, setTheme]);

  useEffect(() => {
    localStorage.setItem("app-font-size", fontSize);
    const htmlElement = document.documentElement;
    Object.values(FONT_SIZE_CLASSES).forEach(cls => htmlElement.classList.remove(cls));
    if (FONT_SIZE_CLASSES[fontSize]) {
      htmlElement.classList.add(FONT_SIZE_CLASSES[fontSize]);
    }
  }, [fontSize]);


  const handleSaveSettings = () => {
    toast({
      title: "Settings Applied",
      description: "Your preferences have been updated and saved.",
    });
  };

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

      {/* Appearance Settings */}
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

      {/* Regional Preferences */}
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

      {/* Account Settings Placeholder */}
       <motion.div initial="initial" animate="animate" variants={cardMotionVariants(0.3)} viewport={{ once: true }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center font-headline">
              <UserIconLucide className="mr-2 h-6 w-6 text-primary" />
               Account
            </CardTitle>
            <CardDescription>Manage your account details and security.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced account settings like password change, 2FA, and connected accounts will be available here in future updates.
              You can log out via the user menu in the top right.
            </p>
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
// Placeholder UserIcon, replace if you have a specific one, or remove if not needed for this card's title.
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
