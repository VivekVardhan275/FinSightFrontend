
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
import { Palette, BellRing, Globe, Save, User as UserIconLucide } from "lucide-react"; // UserIcon might clash with local one
import { motion } from "framer-motion";
import { useCurrency, type Currency as AppCurrency } from "@/contexts/currency-context";


type ThemeSetting = "light" | "dark" | "system";
type FontSizeSetting = "small" | "medium" | "large";

const FONT_SIZE_CLASSES: Record<FontSizeSetting, string> = {
  small: "font-size-small",
  medium: "font-size-medium",
  large: "font-size-large",
};

export default function SettingsPage() {
  const { theme: activeTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();


  // Appearance
  const [currentTheme, setCurrentTheme] = useState<ThemeSetting>("system");
  const [fontSize, setFontSize] = useState<FontSizeSetting>("medium");

  // Notifications
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [billReminders, setBillReminders] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    // Theme
    const storedTheme = localStorage.getItem("app-theme") as ThemeSetting | null;
    if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
      setCurrentTheme(storedTheme);
    } else {
      // If "app-theme" is not in localStorage, initialize currentTheme based on next-themes' activeTheme or system default.
      // The useEffect watching currentTheme will then save this initial value.
      setCurrentTheme((activeTheme as ThemeSetting) || "system");
    }

    // Font Size
    const storedFontSize = localStorage.getItem("app-font-size") as FontSizeSetting | null;
    if (storedFontSize && FONT_SIZE_CLASSES[storedFontSize]) {
      setFontSize(storedFontSize);
    }
    // If not found, fontSize state remains its `useState` default ("medium").
    // The useEffect watching fontSize will persist this default.

    // Budget Alerts
    const storedBudgetAlerts = localStorage.getItem("app-budget-alerts");
    if (storedBudgetAlerts !== null) { // Check for null explicitly, as "false" is a valid string value
      setBudgetAlerts(storedBudgetAlerts === "true");
    }
    // If not found, budgetAlerts state remains its `useState` default. useEffect will persist it.
    
    const storedWeeklySummary = localStorage.getItem("app-weekly-summary");
    if (storedWeeklySummary !== null) {
      setWeeklySummary(storedWeeklySummary === "true");
    }
     // If not found, weeklySummary state remains its `useState` default. useEffect will persist it.

    const storedBillReminders = localStorage.getItem("app-bill-reminders");
    if (storedBillReminders !== null) {
      setBillReminders(storedBillReminders === "true");
    }
    // If not found, billReminders state remains its `useState` default. useEffect will persist it.

  // activeTheme is included because if next-themes resolves its theme *after* initial mount,
  // we want to ensure our currentTheme state aligns with it if "app-theme" wasn't already set.
  // For other settings, they don't depend on an external async provider like next-themes,
  // so an empty dependency array `[]` for a combined effect, or individual effects as below, is fine.
  // For simplicity and clarity, this main loading effect runs once. Subsequent sync for theme is handled
  // by user interaction or if activeTheme changes and "app-theme" wasn't set.
  }, [activeTheme]); 
  
  // Persist settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("app-theme", currentTheme);
    setTheme(currentTheme); // Apply theme using next-themes
  }, [currentTheme, setTheme]);

  useEffect(() => {
    localStorage.setItem("app-font-size", fontSize);
    const htmlElement = document.documentElement;
    Object.values(FONT_SIZE_CLASSES).forEach(cls => htmlElement.classList.remove(cls));
    if (FONT_SIZE_CLASSES[fontSize]) {
      htmlElement.classList.add(FONT_SIZE_CLASSES[fontSize]);
    }
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("app-budget-alerts", String(budgetAlerts));
  }, [budgetAlerts]);

  useEffect(() => {
    localStorage.setItem("app-weekly-summary", String(weeklySummary));
  }, [weeklySummary]);

  useEffect(() => {
    localStorage.setItem("app-bill-reminders", String(billReminders));
  }, [billReminders]);


  const handleSaveSettings = () => {
    // localStorage saving is now handled by individual useEffects.
    // This function can primarily be for user feedback.
    toast({
      title: "Settings Applied",
      description: "Your preferences have been updated and saved.",
    });
  };

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Customize your application experience.
        </p>
      </motion.div>

      {/* Appearance Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
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

      {/* Notification Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center font-headline">
              <BellRing className="mr-2 h-6 w-6 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="budget-alerts" className="font-medium">Budget Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Receive alerts when you're nearing or over budget.
                </p>
              </div>
              <Switch id="budget-alerts" checked={budgetAlerts} onCheckedChange={setBudgetAlerts} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="weekly-summary" className="font-medium">Weekly Summary Email</Label>
                <p className="text-xs text-muted-foreground">
                  Get a summary of your finances every week. (Feature coming soon)
                </p>
              </div>
              <Switch id="weekly-summary" checked={weeklySummary} onCheckedChange={setWeeklySummary} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="bill-reminders" className="font-medium">Bill Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Get reminders for upcoming bill payments. (Feature coming soon)
                </p>
              </div>
              <Switch id="bill-reminders" checked={billReminders} onCheckedChange={setBillReminders} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Regional Preferences */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
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
       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
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


      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="flex justify-end pt-4">
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

