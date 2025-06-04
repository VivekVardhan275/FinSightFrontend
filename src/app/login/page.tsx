
"use client";

import { AppLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthState } from '@/hooks/use-auth-state';
import { ChromeIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login, user, isLoading } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (isLoading || user) {
    // Show a loading state or null if redirecting
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-background to-secondary p-4">
      <main className="flex flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center">
              <div className="mb-4 flex items-center justify-center space-x-2">
                <AppLogo className="h-12 w-12 text-primary" />
                <h1 className="font-headline text-4xl font-bold text-primary">Foresight Finance</h1>
              </div>
              <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to manage your finances and forecast your financial future.</CardDescription>
            </CardHeader>
            <CardContent className="py-12">
              <Button 
                onClick={login} 
                className="w-full transition-all hover:shadow-lg hover:scale-105" 
                size="lg"
                disabled={isLoading}
                asChild
              >
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <ChromeIcon className="mr-2 h-5 w-5" />
                  Sign in with Google
                </motion.button>
              </Button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                By signing in, you agree to our terms of service.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <footer className="py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Foresight Finance. All rights reserved.
      </footer>
    </div>
  );
}
