
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuthState } from "@/hooks/use-auth-state";
import { User as UserIcon, Mail, Edit3, BellRing, Palette, Save, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, isLoading } = useAuthState();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [initialDisplayNameForEdit, setInitialDisplayNameForEdit] = useState("");
  const [initialPhoneNumberForEdit, setInitialPhoneNumberForEdit] = useState("");


  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [billReminders, setBillReminders] = useState(true);

  useEffect(() => {
    if (user) {
      const initialName = user.name || "";
      setDisplayName(initialName);
      setInitialDisplayNameForEdit(initialName); 
      
      // Phone number isn't in user object, so it defaults to empty
      const initialPhone = ""; // If user object could have phone: user.phone || "";
      setPhoneNumber(initialPhone); 
      setInitialPhoneNumberForEdit(initialPhone);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "";
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  const handleEditPersonalInfo = () => {
    setInitialDisplayNameForEdit(displayName);
    setInitialPhoneNumberForEdit(phoneNumber);
    setIsEditingPersonalInfo(true);
  };

  const handleCancelPersonalInfoEdit = () => {
    setDisplayName(initialDisplayNameForEdit);
    setPhoneNumber(initialPhoneNumberForEdit);
    setIsEditingPersonalInfo(false);
  };

  const handleSaveChanges = () => {
    // In a real app, you'd save these to your backend
    console.log("Saving profile:", { displayName, phoneNumber });
    toast({
      title: "Profile Updated",
      description: "Your personal information has been (simulated) saved.",
    });
    setIsEditingPersonalInfo(false);
    // Update initial values for the next edit session
    setInitialDisplayNameForEdit(displayName);
    setInitialPhoneNumberForEdit(phoneNumber);
  };

  const handleSavePreferences = () => {
    // In a real app, you'd save these to your backend
    console.log("Saving preferences:", { budgetAlerts, weeklySummary, billReminders });
    toast({
      title: "Preferences Updated",
      description: "Your application preferences have been (simulated) saved.",
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
          Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-8 md:grid-cols-3"
      >
        <Card className="md:col-span-1 shadow-lg">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
              <AvatarImage src={user.imageUrl} alt={displayName} data-ai-hint="avatar person" />
              <AvatarFallback className="text-3xl">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-headline">{displayName}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" disabled>
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile Picture
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserIcon className="mr-2 h-6 w-6 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                readOnly={!isEditingPersonalInfo}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={user.email} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="e.g., (123) 456-7890" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
                readOnly={!isEditingPersonalInfo}
              />
            </div>
            <div className="flex justify-end space-x-2">
              {isEditingPersonalInfo ? (
                <>
                  <Button variant="outline" onClick={handleCancelPersonalInfoEdit}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button onClick={handleSaveChanges}>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={handleEditPersonalInfo}>
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Info
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BellRing className="mr-2 h-6 w-6 text-primary" />
              Preferences
            </CardTitle>
            <CardDescription>
              Customize your application experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-md font-medium">Notification Settings</h4>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="budget-alerts" className="font-medium">Budget Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive alerts when you're nearing or over budget.
                  </p>
                </div>
                <Switch id="budget-alerts" aria-label="Toggle budget alerts" checked={budgetAlerts} onCheckedChange={setBudgetAlerts} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="weekly-summary" className="font-medium">Weekly Summary Email</Label>
                  <p className="text-xs text-muted-foreground">
                    Get a summary of your finances every week.
                  </p>
                </div>
                <Switch id="weekly-summary" aria-label="Toggle weekly summary email" checked={weeklySummary} onCheckedChange={setWeeklySummary} />
              </div>
               <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="bill-reminders" className="font-medium">Bill Reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Get reminders for upcoming bill payments.
                  </p>
                </div>
                <Switch id="bill-reminders" aria-label="Toggle bill reminders" checked={billReminders} onCheckedChange={setBillReminders} />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={handleSavePreferences}>
                <Edit3 className="mr-2 h-4 w-4" /> Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
