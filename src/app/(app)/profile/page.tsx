
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/hooks/use-auth-state";
import { User as UserIcon, Mail, Edit3 } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user, isLoading } = useAuthState();

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
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
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
              <AvatarImage src={user.imageUrl} alt={user.name} data-ai-hint="avatar person" />
              <AvatarFallback className="text-3xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-headline">{user.name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline">
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
              Update your personal details here. Fields are currently read-only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" defaultValue={user.name} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue={user.email} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input id="phone" type="tel" placeholder="e.g., (123) 456-7890" readOnly />
            </div>
            <div className="flex justify-end">
              <Button disabled>
                <Edit3 className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
