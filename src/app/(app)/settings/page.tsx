
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

const COMPACT_MODE_CLASS = "compact-mode";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();


  // Appearance
  const [currentTheme, setCurrentTheme] = useState<ThemeSetting>("system");
  const [fontSize, setFontSize] = useState<FontSizeSetting>("medium");
  const [compactMode, setCompactMode] = useState(false);

  // Notifications
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [billReminders, setBillReminders] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("app-theme") as ThemeSetting | null;
    if (storedTheme) {
      setCurrentTheme(storedTheme);
    } else {
      setCurrentTheme((theme as ThemeSetting) || "system");
    }

    const storedFontSize = localStorage.getItem("app-font-size") as FontSizeSetting | null;
    if (storedFontSize) setFontSize(storedFontSize);

    const storedCompactMode = localStorage.getItem("app-compact-mode");
    if (storedCompactMode) setCompactMode(storedCompactMode === "true");

    const storedBudgetAlerts = localStorage.getItem("app-budget-alerts");
    if (storedBudgetAlerts) setBudgetAlerts(storedBudgetAlerts === "true");

    const storedWeeklySummary = localStorage.getItem("app-weekly-summary");
    if (storedWeeklySummary) setWeeklySummary(storedWeeklySummary === "true");
    
    const storedBillReminders = localStorage.getItem("app-bill-reminders");
    if (storedBillReminders) setBillReminders(storedBillReminders === "true");

  }, [theme]);
  
  // Apply theme from state
  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme, setTheme]);


  // Apply font size and compact mode classes
  useEffect(() => {
    const htmlElement = document.documentElement;
    Object.values(FONT_SIZE_CLASSES).forEach(cls => htmlElement.classList.remove(cls));
    if (FONT_SIZE_CLASSES[fontSize]) {
      htmlElement.classList.add(FONT_SIZE_CLASSES[fontSize]);
    }

    if (compactMode) {
      htmlElement.classList.add(COMPACT_MODE_CLASS);
    } else {
      htmlElement.classList.remove(COMPACT_MODE_CLASS);
    }
  }, [fontSize, compactMode]);

  const handleSaveSettings = () => {
    // Save to localStorage
    localStorage.setItem("app-theme", currentTheme);
    localStorage.setItem("app-font-size", fontSize);
    localStorage.setItem("app-compact-mode", String(compactMode));
    localStorage.setItem("app-budget-alerts", String(budgetAlerts));
    localStorage.setItem("app-weekly-summary", String(weeklySummary));
    localStorage.setItem("app-bill-reminders", String(billReminders));

    setTheme(currentTheme);

    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated.",
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
            
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="compact-mode" className="font-medium">Compact Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Reduce spacing for a more data-dense view.
                </p>
              </div>
              <Switch id="compact-mode" checked={compactMode} onCheckedChange={setCompactMode} />
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
              <UserIcon className="mr-2 h-6 w-6 text-primary" />
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
