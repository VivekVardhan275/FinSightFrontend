
"use client";

import { AppLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthState } from '@/hooks/use-auth-state';
import { GithubIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

// Google logo SVG
const GoogleLogo = () => (
  <svg
    className="mr-2 h-6 w-6"
    aria-hidden="true"
    focusable="false"
    data-prefix="fab"
    data-icon="google"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 488 512"
  >
    <path
      fill="currentColor"
      d="M488 261.8C488 403.3 381.5 512 244 512 110.5 512 0 401.5 0 265.5S110.5 19 244 19c70.5 0 131.5 30.5 174.5 78.5l-64 64C320.5 129 286 112 244 112c-88.5 0-160.5 71.5-160.5 158.5S155.5 429 244 429c52.5 0 94-23.5 124.5-62.5 30.5-39 43.5-82.5 46-131.5H244v-81.5h244z"
    ></path>
  </svg>
);

export default function LoginPage() {
  const { loginWithGoogle, loginWithGitHub, isAuthenticated, isLoading, status } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    // useAuthState hook now handles redirection logic based on auth status and setup completion.
    // This useEffect can be simplified or removed if all redirection is handled by the hook.
    // For now, keeping a basic check.
    if (isAuthenticated && status === 'authenticated') {
      // The hook should ideally redirect to /dashboard or /welcome/setup
      // but as a fallback, we can push to dashboard here if somehow missed.
      // router.replace('/dashboard'); // This might conflict with hook's logic. Best to let hook manage.
    }
  }, [isAuthenticated, status, router]);

  if (isLoading || (isAuthenticated && status === 'authenticated')) {
    // Show a loading state or null if redirecting (Auth.js status 'loading' or already 'authenticated')
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-background to-secondary p-4">
      <main className="flex flex-1 flex-col items-center justify-center w-full">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <div className="mb-4 flex items-center justify-center space-x-2">
                <AppLogo className="h-12 w-12 text-primary transform -translate-y-1" />
                <h1 className="font-headline text-4xl font-bold text-primary">FinSight</h1>
              </div>
              <CardTitle className="font-headline text-2xl mb-2">Welcome Back</CardTitle>
              <CardDescription>Sign in to manage your finances and forecast your financial future.</CardDescription>
            </CardHeader>
            <CardContent className="py-16 space-y-4">
              <Button 
                onClick={loginWithGoogle} 
                className="w-full transition-all hover:shadow-lg hover:scale-105" 
                size="lg"
                disabled={isLoading} // status === 'loading'
                asChild
              >
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <GoogleLogo />
                  Sign in with Google
                </motion.button>
              </Button>
              <Button 
                onClick={loginWithGitHub} 
                variant="outline"
                className="w-full transition-all hover:shadow-lg hover:scale-105 border-foreground/20 hover:bg-accent/10 hover:text-foreground" 
                size="lg"
                disabled={isLoading} // status === 'loading'
                asChild
              >
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <GithubIcon className="mr-2 h-5 w-5" />
                  Sign in with GitHub
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
        &copy; {new Date().getFullYear()} FinSight. All rights reserved.
      </footer>
    </div>
  );
}
