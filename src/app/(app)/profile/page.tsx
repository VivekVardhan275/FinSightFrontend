
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthState } from "@/hooks/use-auth-state";
import { User as UserIconLucide, Mail, Edit3, Save, XCircle, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import axios from "axios"; // Import axios

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const PROFILE_API_URL = `${backendUrl}/api/user/profile`;

const pageHeaderBlockMotionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const contentMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
};

const ReadOnlyFieldDisplay = ({ value, placeholder = "Not set" }: { value: string | null | undefined, placeholder?: string }) => (
  <div className="flex h-10 w-full items-center rounded-md border border-transparent bg-transparent px-3 py-2 text-sm">
    {value || <span className="text-muted-foreground">{placeholder}</span>}
  </div>
);

export default function ProfilePage() {
  const { user, isLoading: authLoading, updateSession } = useAuthState();
  const { toast } = useToast();

  // Profile form state
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  // State to hold initial values for "cancel edit"
  const [initialDisplayNameForEdit, setInitialDisplayNameForEdit] = useState("");
  const [initialPhoneNumberForEdit, setInitialPhoneNumberForEdit] = useState("");
  const [initialDateOfBirthForEdit, setInitialDateOfBirthForEdit] = useState("");
  const [initialGenderForEdit, setInitialGenderForEdit] = useState("");

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);

  const profileFetchedForUserRef = useRef<string | null>(null);
  const [isProfileDataLoading, setIsProfileDataLoading] = useState(true); // Initialize to true
  const [isSaving, setIsSaving] = useState(false);

  const userEmail = user?.email;
  const currentUserNameFromSession = user?.name; // For fallback if profile is new

  const fetchProfileData = useCallback(async (emailToFetch: string) => {
    // setIsProfileDataLoading(true) is managed by the calling useEffect based on authLoading or fetch initiation
    try {
      const response = await axios.get(`${PROFILE_API_URL}?email=${encodeURIComponent(emailToFetch)}`);
      const profileData = response.data;

      const apiDisplayName = profileData.displayName || currentUserNameFromSession || "";
      const apiPhoneNumber = profileData.phoneNumber || "";
      const apiDateOfBirth = profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : "";
      const apiGender = profileData.gender || "";

      setDisplayName(apiDisplayName);
      setPhoneNumber(apiPhoneNumber);
      setDateOfBirth(apiDateOfBirth);
      setGender(apiGender);

      setInitialDisplayNameForEdit(apiDisplayName);
      setInitialPhoneNumberForEdit(apiPhoneNumber);
      setInitialDateOfBirthForEdit(apiDateOfBirth);
      setInitialGenderForEdit(apiGender);

      toast({
        title: "Profile Loaded",
        description: "Your profile information has been successfully loaded.",
        variant: "default",
      });
      profileFetchedForUserRef.current = emailToFetch; // Mark success for this email
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast({
        title: "Error Loading Profile",
        description: "Could not fetch your profile information. Displaying defaults.",
        variant: "destructive",
      });
      const fallbackName = currentUserNameFromSession || "";
      setDisplayName(fallbackName);
      setInitialDisplayNameForEdit(fallbackName);
      setPhoneNumber(""); setInitialPhoneNumberForEdit("");
      setDateOfBirth(""); setInitialDateOfBirthForEdit("");
      setGender(""); setInitialGenderForEdit("");
      profileFetchedForUserRef.current = null; // Reset on error to allow retry
    } finally {
      setIsProfileDataLoading(false); // Always set to false after attempt
    }
  }, [toast, currentUserNameFromSession]); // Dependencies: toast, currentUserNameFromSession (for fallback)

  useEffect(() => {
    if (authLoading) {
      if (!isProfileDataLoading) setIsProfileDataLoading(true);
      return;
    }

    // Auth is settled
    if (userEmail) {
      if (profileFetchedForUserRef.current !== userEmail) {
        // Need to fetch for this user OR previous fetch failed
        setIsProfileDataLoading(true); // Set loading before fetch
        fetchProfileData(userEmail);
      } else {
        // Data already fetched for this user, or fetch attempt completed.
        if (isProfileDataLoading) setIsProfileDataLoading(false);
      }
    } else {
      // Not authLoading, and no userEmail (e.g., unauthenticated)
      const fallbackName = currentUserNameFromSession || "";
      setDisplayName(fallbackName);
      setInitialDisplayNameForEdit(fallbackName);
      setPhoneNumber(""); setInitialPhoneNumberForEdit("");
      setDateOfBirth(""); setInitialDateOfBirthForEdit("");
      setGender(""); setInitialGenderForEdit("");

      if (isProfileDataLoading) setIsProfileDataLoading(false);
      profileFetchedForUserRef.current = null;
    }
  }, [userEmail, authLoading, fetchProfileData, currentUserNameFromSession]);


  if (authLoading || isProfileDataLoading) {
    return (
      <div className="flex h-full items-center justify-center">
         <RotateCw className="mr-2 h-6 w-6 animate-spin text-primary" />
        <p>Loading profile information...</p>
      </div>
    );
  }

  if (!user) { // Should be covered by authLoading/isProfileDataLoading, but as a fallback
    return (
      <div className="flex h-full items-center justify-center">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "?";
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  const handleEditPersonalInfo = () => {
    // Ensure initial edit states are set from current display values before editing
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

  const handleSaveChanges = async () => {
    if (!user || !user.email) {
      toast({ title: "Error", description: "User session not found. Please re-login.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const profileDataToSave = {
      displayName: displayName,
      phoneNumber: phoneNumber || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
    };

    try {
      await axios.put(`${PROFILE_API_URL}?email=${encodeURIComponent(user.email)}`, profileDataToSave);
      toast({
        title: "Profile Updated",
        description: "Your personal information has been successfully saved.",
        variant: "default",
      });
      setIsEditingPersonalInfo(false);
      // Update initial states to reflect saved changes
      setInitialDisplayNameForEdit(displayName);
      setInitialPhoneNumberForEdit(phoneNumber);
      setInitialDateOfBirthForEdit(dateOfBirth);
      setInitialGenderForEdit(gender);

      // If displayName changed, update the NextAuth session
      if (user.name !== displayName) {
        // updateSession might trigger a re-render of this page.
        // The useEffect for data fetching should not re-fetch due to profileFetchedForUserRef.
        await updateSession({ user: { ...user, name: displayName } });
      }

    } catch (error) {
      console.error("Error saving profile data:", error);
      let errorMessage = "Could not save your changes. Please try again.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      }
      toast({
        title: "Error Saving Profile",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailClick = () => {
    toast({
      title: "Email Address",
      description: "Your email address cannot be changed here. It's tied to your login provider.",
    });
  };

  const getFormattedGender = (genderValue: string) => {
    if (!genderValue) return ""; // Placeholder if not set
    const formatted = genderValue.charAt(0).toUpperCase() + genderValue.slice(1).replace(/_/g, " ");
    if (["Male", "Female", "Other", "Prefer not to say"].includes(formatted)) {
        return formatted;
    }
    return "Not set"; // Fallback for unexpected values
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
          Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information. For other preferences, visit the Settings page.
        </p>
      </motion.div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={contentMotionVariants}
        className="grid gap-8 md:grid-cols-3"
        viewport={{ once: true }}
      >
        <Card className="md:col-span-1 shadow-lg">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
              {/* Removed AvatarImage, relying on AvatarFallback */}
              <AvatarFallback className="text-3xl">{getInitials(displayName || user.name || "")}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-headline">{displayName || user.name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-0">
            {/* Edit Profile Picture button can be added here if needed */}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center font-headline">
              <UserIconLucide className="mr-2 h-6 w-6 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details here. Click 'Edit Info' to make changes.
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
                  placeholder="Enter your full name"
                  disabled={isSaving}
                />
              ) : (
                <ReadOnlyFieldDisplay value={displayName} placeholder="Full name not set" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div
                id="email"
                onClick={handleEmailClick}
                className={cn(
                  "flex h-10 w-full items-center rounded-md border border-transparent bg-transparent px-3 py-2 text-sm",
                  "cursor-not-allowed opacity-70" // Visually indicate it's not editable
                )}
                title="Your email address cannot be changed."
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
                  disabled={isSaving}
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
                  max={new Date().toISOString().split("T")[0]} // Prevent future dates
                  disabled={isSaving}
                />
              ) : (
                 <ReadOnlyFieldDisplay value={dateOfBirth ? new Date(dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : null} placeholder="Select date of birth" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              {isEditingPersonalInfo ? (
                <Select value={gender} onValueChange={setGender} disabled={isSaving}>
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
                    <Button variant="outline" onClick={handleCancelPersonalInfoEdit} disabled={isSaving}>
                      <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                      {isSaving ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {isSaving ? "Saving..." : "Save Changes"}
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
    </div>
  );
}
