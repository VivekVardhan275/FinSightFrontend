
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
import { Palette, Globe, Save, RotateCw, ShieldAlert, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCurrency, type Currency as AppCurrency } from "@/contexts/currency-context";
import { useAuthState } from "@/hooks/use-auth-state";
import axios from "axios";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { Separator } from "@/components/ui/separator";

const SETTINGS_API_URL = "http://localhost:8080/api/user/settings";
const ACCOUNT_API_URL = "http://localhost:8080/api/user/account"; // Conceptual

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
    // console.error(`Error reading ${key} from localStorage`, error);
  }
  return defaultValue;
};


export default function SettingsPage() {
  const { user, isLoading: authLoading, appLogout } = useAuthState();
  const { theme: activeGlobalTheme, setTheme: setGlobalTheme } = useTheme();
  const { toast } = useToast();
  const { selectedCurrency: globalSelectedCurrency, setSelectedCurrency: setGlobalSelectedCurrency } = useCurrency();

  // Local form states for appearance and regional
  const [formTheme, setFormTheme] = useState<ThemeSetting>("system");
  const [formFontSize, setFormFontSize] = useState<FontSizeSetting>("medium");
  const [formCurrency, setFormCurrency] = useState<AppCurrency>("INR");
  
  const [isSettingsReflectingGlobal, setIsSettingsReflectingGlobal] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Account Deletion State
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Effect to initialize form states from global/localStorage once auth is resolved
  useEffect(() => {
    if (!authLoading && !isSettingsReflectingGlobal) {
      if (activeGlobalTheme && ["light", "dark", "system"].includes(activeGlobalTheme)) {
        setFormTheme(activeGlobalTheme as ThemeSetting);
      } else {
        setFormTheme(initializeFromLocalStorage<ThemeSetting>("app-theme", "system", (v) =>
          ["light", "dark", "system"].includes(v)
        ));
      }

      setFormFontSize(initializeFromLocalStorage<FontSizeSetting>("app-font-size", "medium", (v) =>
        !!FONT_SIZE_CLASSES[v as FontSizeSetting]
      ));
      
      if (globalSelectedCurrency) {
        setFormCurrency(globalSelectedCurrency);
      }
      setIsSettingsReflectingGlobal(true);
    }
  }, [authLoading, activeGlobalTheme, globalSelectedCurrency, isSettingsReflectingGlobal]);


  const handleSaveSettings = async () => {
    if (!user || !user.email) {
        toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
        return;
    }
    setIsSavingSettings(true);

    setGlobalTheme(formTheme); 
    localStorage.setItem("app-theme", formTheme);

    setGlobalSelectedCurrency(formCurrency);

    localStorage.setItem("app-font-size", formFontSize); 
    if (typeof window !== "undefined") {
        const htmlElement = document.documentElement;
        Object.values(FONT_SIZE_CLASSES).forEach(cls => htmlElement.classList.remove(cls));
        if (FONT_SIZE_CLASSES[formFontSize]) {
          htmlElement.classList.add(FONT_SIZE_CLASSES[formFontSize]);
        } else {
          htmlElement.classList.add(FONT_SIZE_CLASSES.medium);
        }
    }

    const settingsToSaveToBackend = {
      theme: formTheme,
      fontSize: formFontSize,
      currency: formCurrency,
    };

    try {
      await axios.put(`${SETTINGS_API_URL}?email=${encodeURIComponent(user.email)}`, settingsToSaveToBackend);
      
      toast({
        title: "Settings Saved",
        description: "Your preferences have been successfully saved and applied.",
      });
    } catch (error) {
      console.error("Error saving settings to backend:", error);
      let errorMessage = "Could not save your preferences to the server. Local changes have been applied.";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast({
        title: "Error Saving Settings",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const generateConfirmationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleOpenDeleteDialog = () => {
    setConfirmationCode(generateConfirmationCode());
    setIsDeleteAccountDialogOpen(true);
  };

  const handleConfirmAccountDeletion = async () => {
    if (!user || !user.email) {
      toast({ title: "Authentication Error", description: "User session not found. Please re-login.", variant: "destructive" });
      setIsDeleteAccountDialogOpen(false);
      return;
    }
    setIsDeletingAccount(true);
    try {
      // Simulate API call for account deletion
      // In a real app, replace this with: await axios.delete(`${ACCOUNT_API_URL}?email=${encodeURIComponent(user.email)}`);
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      toast({
        title: "Account Deletion Initiated",
        description: "Your account deletion process has started. You will be logged out.",
        variant: "default",
      });
      setIsDeleteAccountDialogOpen(false);
      // Wait for toast to be visible then logout
      setTimeout(async () => {
        await appLogout(); 
        // router.push('/login') is handled by useAuthState after logout
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      let errorMessage = "Failed to delete your account. Please try again.";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast({
        title: "Account Deletion Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsDeletingAccount(false); // Keep dialog open or allow retry
    }
    // No finally here for setIsDeletingAccount, as logout will unmount component
  };


  if (authLoading || !isSettingsReflectingGlobal) {
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
          Customize your application experience. Changes are applied upon saving.
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
              <Select 
                value={formTheme} 
                onValueChange={(value: string) => setFormTheme(value as ThemeSetting)}
                disabled={isSavingSettings}
              >
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
              <RadioGroup 
                value={formFontSize} 
                onValueChange={(value: string) => setFormFontSize(value as FontSizeSetting)} 
                className="flex space-x-4"
                disabled={isSavingSettings}
              >
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
              <Select 
                value={formCurrency} 
                onValueChange={(value: string) => setFormCurrency(value as AppCurrency)}
                disabled={isSavingSettings}
              >
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

      <motion.div initial="initial" animate="animate" variants={cardMotionVariants(0.3)} viewport={{ once: true }}>
        <Card className="shadow-lg border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center font-headline text-destructive">
              <ShieldAlert className="mr-2 h-6 w-6" />
              Account Settings
            </CardTitle>
            <CardDescription>Manage your account status and data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-md font-semibold">Delete Account</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" onClick={handleOpenDeleteDialog} disabled={isSavingSettings || isDeletingAccount}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial="initial" animate="animate" variants={cardMotionVariants(0.4)} className="flex justify-end pt-4" viewport={{ once: true }}>
        <Button onClick={handleSaveSettings} size="lg" disabled={isSavingSettings || isDeletingAccount}>
          {isSavingSettings && <RotateCw className="mr-2 h-5 w-5 animate-spin" />}
          {isSavingSettings ? "Saving..." : "Save All Settings"}
        </Button>
      </motion.div>

      <DeleteAccountDialog
        open={isDeleteAccountDialogOpen}
        onOpenChange={setIsDeleteAccountDialogOpen}
        confirmationCodeToMatch={confirmationCode}
        onConfirmDelete={handleConfirmAccountDeletion}
        isDeleting={isDeletingAccount}
      />
    </div>
  );
}

    