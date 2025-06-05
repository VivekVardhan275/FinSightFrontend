
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useAuthState, type AppUser } from "@/hooks/use-auth-state";
import { useTheme } from "next-themes";
import { useCurrency, type Currency as AppCurrency } from "@/contexts/currency-context";
import { useToast } from "@/hooks/use-toast";
import { User as UserIconLucide, Palette, Globe, Save } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import axios from "axios"; // Import axios

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
    // console.error(`Error reading ${key} from localStorage`, error); // Keep console clean
  }
  return defaultValue;
};

const USER_SETUP_API_URL = "http://localhost:8080/api/users/setup";


export default function SetupPage() {
  const { user, isLoading: authLoading, status, isAuthenticated, updateSession } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const { theme: activeTheme, setTheme } = useTheme();
  const { selectedCurrency, setSelectedCurrency: setGlobalCurrency } = useCurrency();
  const { toast } = useToast();

  // Profile states
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  // Settings states
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
  const [currentSelectedCurrency, setCurrentSelectedCurrency] = useState<AppCurrency>(selectedCurrency);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && status === 'unauthenticated' && pathname !== '/login') {
      router.replace('/login');
      return;
    }
    // If authenticated and setup already complete (from session), redirect to dashboard
    if (status === 'authenticated' && user?.hasCompletedSetup) {
      router.replace('/dashboard');
      return;
    }

    if (user) {
      setDisplayName(user.name || "");
    }
  }, [user, authLoading, status, router, pathname]);


  useEffect(() => {
    const storedAppTheme = localStorage.getItem("app-theme");
    if (!storedAppTheme && activeTheme && ["light", "dark", "system"].includes(activeTheme)) {
      setCurrentTheme(activeTheme as ThemeSetting);
    }
  }, [activeTheme]);

  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme, setTheme]);

  useEffect(() => {
    const htmlElement = document.documentElement;
    Object.values(FONT_SIZE_CLASSES).forEach(cls => htmlElement.classList.remove(cls));
    if (FONT_SIZE_CLASSES[fontSize]) {
      htmlElement.classList.add(FONT_SIZE_CLASSES[fontSize]);
    }
  }, [fontSize]);

  useEffect(() => {
    setCurrentSelectedCurrency(selectedCurrency);
  }, [selectedCurrency]);


  const handleSaveSetup = useCallback(async () => {
    if (!user || !user.email) { // Ensure user and email are present
      toast({ title: "Error", description: "User information is missing. Please try logging in again.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setIsSaving(true);

    const setupPayload = {
      email: user.email, // Primary identifier for backend
      displayName: displayName || user.name, // Fallback to original name if display name is empty
      phoneNumber: phoneNumber || null, // Send null if empty
      dateOfBirth: dateOfBirth || null, // Send null if empty
      gender: gender || null, // Send null if empty
      preferences: {
        theme: currentTheme,
        fontSize: fontSize,
        currency: currentSelectedCurrency,
      }
    };

    try {
      // Step 1: Send data to your backend API
      await axios.post(USER_SETUP_API_URL, setupPayload);

      // Step 2: Persist app settings to localStorage (these are client-side preferences)
      localStorage.setItem("app-theme", currentTheme);
      localStorage.setItem("app-font-size", fontSize);
      setGlobalCurrency(currentSelectedCurrency); // This updates context and localStorage

      // Step 3: Update the NextAuth session to mark setup as complete and update name
      await updateSession({ user: { ...user, name: displayName, hasCompletedSetup: true } }); 
      
      toast({
        title: "Setup Complete!",
        description: "Your profile and preferences have been saved.",
        variant: "default"
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Give toast time to show
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

  }, [user, displayName, phoneNumber, dateOfBirth, gender, currentTheme, fontSize, currentSelectedCurrency, setGlobalCurrency, router, toast, updateSession]);

  if (authLoading || status === 'loading' || (status === 'unauthenticated' && pathname === '/welcome/setup') || (status === 'authenticated' && user?.hasCompletedSetup === undefined) ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p>Loading setup...</p>
      </div>
    );
  }
  
  if (!isAuthenticated && status !== 'loading') {
     router.replace('/login');
     return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <p>Redirecting to login...</p>
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
            {/* Personal Information Section */}
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
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={user?.email || ""}
                    readOnly 
                    className="cursor-not-allowed bg-muted/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="(123) 456-7890" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)} 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
                  <Input 
                    id="dateOfBirth" 
                    type="date" 
                    value={dateOfBirth} 
                    onChange={(e) => setDateOfBirth(e.target.value)} 
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="gender">Gender (Optional)</Label>
                  <Select value={gender} onValueChange={setGender}>
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

            {/* Appearance Settings Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-3">
                <Palette className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold font-headline">Appearance</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <Label>Font Size</Label>
                  <RadioGroup value={fontSize} onValueChange={(value: string) => setFontSize(value as FontSizeSetting)} className="flex space-x-4 pt-2">
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

            {/* Regional Settings Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold font-headline">Regional</h2>
              </div>
               <div className="space-y-1.5">
                <Label htmlFor="currency-select">Default Currency</Label>
                <Select value={currentSelectedCurrency} onValueChange={(value: string) => setCurrentSelectedCurrency(value as AppCurrency)}>
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
              <Button onClick={handleSaveSetup} size="lg" disabled={isSaving || authLoading || status === 'loading'}>
                <Save className="mr-2 h-5 w-5" />
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
    
