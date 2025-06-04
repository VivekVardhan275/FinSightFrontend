
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthState } from "@/hooks/use-auth-state";
import { User as UserIcon, Mail, Edit3, BellRing, Palette, Save, XCircle, CalendarDays, Phone } from "lucide-react";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const ReadOnlyFieldDisplay = ({ value, placeholder = "Not set" }: { value: string | null | undefined, placeholder?: string }) => (
  <div className="flex h-10 w-full items-center rounded-md border border-transparent bg-transparent px-3 py-2 text-sm">
    {value || <span className="text-muted-foreground">{placeholder}</span>}
  </div>
);

export default function ProfilePage() {
  const { user, isLoading } = useAuthState();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [initialDisplayNameForEdit, setInitialDisplayNameForEdit] = useState("");
  const [initialPhoneNumberForEdit, setInitialPhoneNumberForEdit] = useState("");
  const [initialDateOfBirthForEdit, setInitialDateOfBirthForEdit] = useState("");
  const [initialGenderForEdit, setInitialGenderForEdit] = useState("");

  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [billReminders, setBillReminders] = useState(true);

  useEffect(() => {
    if (user) {
      const initialName = user.name || "";
      setDisplayName(initialName);
      setInitialDisplayNameForEdit(initialName); 
      
      // Assuming these are not part of the initial user object from useAuthState
      const initialPhone = ""; // Load from user profile data if available
      setPhoneNumber(initialPhone); 
      setInitialPhoneNumberForEdit(initialPhone);

      const initialDob = ""; // Load from user profile data if available
      setDateOfBirth(initialDob);
      setInitialDateOfBirthForEdit(initialDob);

      const initialGen = ""; // Load from user profile data if available
      setGender(initialGen);
      setInitialGenderForEdit(initialGen);
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
    setInitialDateOfBirthForEdit(dateOfBirth);
    setInitialGenderForEdit(gender);
    setIsEditingPersonalInfo(true);
  };

  const handleCancelPersonalInfoEdit = () => {
    setDisplayName(initialDisplayNameForEdit);
    setPhoneNumber(initialPhoneNumberForEdit);
    setDateOfBirth(initialDateOfBirthForEdit);
    setGender(initialGenderForEdit);
    setIsEditingPersonalInfo(false);
  };

  const handleSaveChanges = () => {
    // In a real app, you would save these to a backend.
    console.log("Saving profile:", { displayName, phoneNumber, dateOfBirth, gender });
    toast({
      title: "Profile Updated",
      description: "Your personal information has been (simulated) saved.",
    });
    setIsEditingPersonalInfo(false);
    // Update initial values for next edit session
    setInitialDisplayNameForEdit(displayName);
    setInitialPhoneNumberForEdit(phoneNumber);
    setInitialDateOfBirthForEdit(dateOfBirth);
    setInitialGenderForEdit(gender);
  };

  const handleSavePreferences = () => {
    // In a real app, you would save these to a backend.
    console.log("Saving preferences:", { budgetAlerts, weeklySummary, billReminders });
    toast({
      title: "Preferences Updated",
      description: "Your application preferences have been (simulated) saved.",
    });
  };
  
  const handleEmailClick = () => {
    toast({
      title: "Email Address",
      description: "Your email address cannot be changed.",
    });
  };

  const getFormattedGender = (genderValue: string) => {
    if (!genderValue) return "";
    return genderValue.charAt(0).toUpperCase() + genderValue.slice(1).replace(/_/g, " ");
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
            <Button variant="outline" disabled> {/* Kept disabled as per previous behavior */}
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile Picture
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center font-headline">
              <UserIcon className="mr-2 h-6 w-6 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              {isEditingPersonalInfo ? (
                <Input 
                  id="fullName" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              ) : (
                <ReadOnlyFieldDisplay value={displayName} placeholder="Enter your full name" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div
                id="email"
                onClick={handleEmailClick}
                className={cn(
                  "flex h-10 w-full items-center rounded-md border border-transparent bg-transparent px-3 py-2 text-sm",
                  "cursor-not-allowed"
                )}
              >
                {user.email}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {isEditingPersonalInfo ? (
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="e.g., (123) 456-7890" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                />
              ) : (
                <ReadOnlyFieldDisplay value={phoneNumber} placeholder="Add phone number" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              {isEditingPersonalInfo ? (
                <Input 
                  id="dateOfBirth" 
                  type="date" 
                  value={dateOfBirth} 
                  onChange={(e) => setDateOfBirth(e.target.value)} 
                />
              ) : (
                 <ReadOnlyFieldDisplay value={dateOfBirth ? new Date(dateOfBirth + 'T00:00:00').toLocaleDateString('en-CA') : null} placeholder="Select date of birth" />
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              {isEditingPersonalInfo ? (
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
              ) : (
                <ReadOnlyFieldDisplay value={getFormattedGender(gender)} placeholder="Select gender" />
              )}
            </div>

            <div className="pt-2">
              <Separator className="mb-4" />
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
            <CardTitle className="flex items-center font-headline">
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

