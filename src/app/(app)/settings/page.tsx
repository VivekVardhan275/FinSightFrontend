
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react"; // Renamed to avoid conflict
import { motion } from "framer-motion";

export default function SettingsPage() {
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
          Configure your application settings.
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
              <SettingsIcon className="mr-2 h-6 w-6 text-primary" />
              Application Settings
            </CardTitle>
            <CardDescription>
              This page is under construction.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
            <SettingsIcon className="mx-auto h-16 w-16 text-primary/70" />
            <h3 className="mt-6 text-xl font-semibold">Settings Page</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Configuration options will be available here soon.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
