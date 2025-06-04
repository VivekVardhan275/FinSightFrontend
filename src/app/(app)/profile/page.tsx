
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
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
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-6 w-6 text-primary" />
              Your Profile
            </CardTitle>
            <CardDescription>
              This page is under construction.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
            <User className="mx-auto h-16 w-16 text-primary/70" />
            <h3 className="mt-6 text-xl font-semibold">Profile Page</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Content for user profile management will be here.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
