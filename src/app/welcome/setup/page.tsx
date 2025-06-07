
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useAuthState } from "@/hooks/use-auth-state"; 
import { useTheme } from "next-themes";
import { useCurrency, type Currency as AppCurrency } from "@/contexts/currency-context";
import { useToast } from "@/hooks/use-toast";
import { User as UserIconLucide, Palette, Globe, Save, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation"; 


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

const USER_SETUP_API_URL = "http://localhost:8080/api/user/setup";


export default function SetupPage() {
  const { user, isLoading: authStateIsLoading, status, updateSession } = useAuthState();
  const router = useRouter(); 
  
  const { setTheme: setGlobalTheme } = useTheme();
  const { selectedCurrency: initialGlobalCurrency, setSelectedCurrency: setGlobalCurrencyContext } = useCurrency();
  const { toast } = useToast();

  // Personal Information States
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formPhoneNumber, setFormPhoneNumber] = useState("");
  const [formDateOfBirth, setFormDateOfBirth] = useState("");
  const [formGender, setFormGender] = useState("");

  // Appearance & Regional Form States
  const [formTheme, setFormTheme] = useState<ThemeSetting>(() =>
    initializeFromLocalStorage<ThemeSetting>("app-theme", "system", (v) =>
      ["light", "dark", "system"].includes(v)
    )
  );
  const [formFontSize, setFormFontSize] = useState<FontSizeSetting>(() =>
    initializeFromLocalStorage<FontSizeSetting>("app-font-size", "medium", (v) =>
      !!FONT_SIZE_CLASSES[v as FontSizeSetting]
    )
  );
  const [formCurrency, setFormCurrency] = useState<AppCurrency>(initialGlobalCurrency);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && !authStateIsLoading) {
      setFormDisplayName(user.name || "");
    }
  }, [user, authStateIsLoading]);

  const handleSaveSetup = useCallback(async () => {
    if (!user || !user.email) {
      toast({ title: "Error", description: "User information is missing. Please try logging in again.", variant: "destructive" });
      router.push('/login'); 
      return;
    }
    
    if (!formDateOfBirth) {
      toast({ title: "Validation Error", description: "Date of Birth is required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    const setupPayload = {
      email: user.email, 
      displayName: formDisplayName || user.name, 
      phoneNumber: formPhoneNumber || null, 
      dateOfBirth: formDateOfBirth, 
      gender: formGender || null, 
      theme: formTheme,
      fontSize: formFontSize,
      currency: formCurrency,
    };

    try {
      await axios.post(USER_SETUP_API_URL, setupPayload);

      // Apply settings globally AFTER successful save
      setGlobalTheme(formTheme); 
      localStorage.setItem("app-theme", formTheme);

      localStorage.setItem("app-font-size", formFontSize);
      const htmlElement = document.documentElement;
      Object.values(FONT_SIZE_CLASSES).forEach(cls => htmlElement.classList.remove(cls));
      if (FONT_SIZE_CLASSES[formFontSize]) {
        htmlElement.classList.add(FONT_SIZE_CLASSES[formFontSize]);
      } else {
         htmlElement.classList.add(FONT_SIZE_CLASSES.medium); // Default if invalid
      }
      
      setGlobalCurrencyContext(formCurrency);
      // Note: useCurrency context already saves to localStorage

      await updateSession({ user: { ...user, name: formDisplayName, hasCompletedSetup: true } }); 
      
      toast({
        title: "Setup Complete!",
        description: "Your profile and preferences have been saved.",
        variant: "default"
      });
      
      await new Promise(resolve => setTimeout(resolve, 300)); 
      router.push('/dashboard');

    } catch (error) {
      console.error("Failed to save setup data:", error);
      let errorMessage = "Could not save your setup information. Please try again.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      }
      toast({
        title: "Error Saving Setup",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }

  }, [
      user, formDisplayName, formPhoneNumber, formDateOfBirth, formGender, 
      formTheme, formFontSize, formCurrency, 
      setGlobalCurrencyContext, setGlobalTheme, router, toast, updateSession
    ]);

  // Memoized event handlers
  const handleDisplayNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormDisplayName(e.target.value);
  }, []);

  const handlePhoneNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormPhoneNumber(e.target.value);
  }, []);

  const handleDateOfBirthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormDateOfBirth(e.target.value);
  }, []);

  const handleGenderChange = useCallback((value: string) => {
    setFormGender(value);
  }, []);

  const handleThemeChange = useCallback((value: string) => {
    setFormTheme(value as ThemeSetting);
  }, []);

  const handleFontSizeChange = useCallback((value: string) => {
    setFormFontSize(value as FontSizeSetting);
  }, []);
  
  const handleCurrencyChange = useCallback((value: string) => {
    setFormCurrency(value as AppCurrency);
  }, []);


  if (authStateIsLoading || (status === 'authenticated' && user?.hasCompletedSetup === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <RotateCw className="mr-2 h-6 w-6 animate-spin text-primary" />
        <p>Loading setup...</p>
      </div>
    );
  }
  
  if (status !== 'authenticated' || (status === 'authenticated' && user?.hasCompletedSetup !== false)) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <RotateCw className="mr-2 h-6 w-6 animate-spin text-primary" />
          <p>Redirecting...</p>
        </div>
     );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4 flex items-center justify-center space-x-2">
              <AppLogo className="h-10 w-10 text-primary transform -translate-y-0.5" />
              <h1 className="font-headline text-3xl font-bold text-primary">FinSight</h1>
            </div>
            <CardTitle className="font-headline text-2xl">Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! Let's get you set up.</CardTitle>
            <CardDescription>Please provide some initial information to personalize your experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 py-8 px-6 md:px-10">
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-3">
                <UserIconLucide className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold font-headline">Personal Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={formDisplayName}
                    onChange={handleDisplayNameChange}
                    placeholder="Your full name"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={user?.email || ""}
                    readOnly 
                    className="cursor-not-allowed bg-muted/50"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="(123) 456-7890" 
                    value={formPhoneNumber} 
                    onChange={handlePhoneNumberChange} 
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input 
                    id="dateOfBirth" 
                    type="date" 
                    value={formDateOfBirth} 
                    onChange={handleDateOfBirthChange} 
                    disabled={isSaving}
                    max={new Date().toISOString().split("T")[0]} 
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="gender">Gender (Optional)</Label>
                  <Select value={formGender} onValueChange={handleGenderChange} disabled={isSaving}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-3">
                <Palette className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold font-headline">Appearance</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="theme-select">Theme</Label>
                  <Select value={formTheme} onValueChange={handleThemeChange} disabled={isSaving}>
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
                <div className="space-y-1.5">
                  <Label>Font Size</Label>
                  <RadioGroup value={formFontSize} onValueChange={handleFontSizeChange} className="flex space-x-4 pt-2" disabled={isSaving}>
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
              </div>
            </section>
            
            <Separator />

            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold font-headline">Regional</h2>
              </div>
               <div className="space-y-1.5">
                <Label htmlFor="currency-select">Default Currency</Label>
                <Select value={formCurrency} onValueChange={handleCurrencyChange} disabled={isSaving}>
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
            </section>

            <Separator className="my-6"/>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveSetup} size="lg" disabled={isSaving || status === 'loading'}>
                {isSaving ? <RotateCw className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                {isSaving? "Saving..." : "Save and Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <footer className="py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} FinSight. Setup your future.
      </footer>
    </div>
  );
}
    

    

    
