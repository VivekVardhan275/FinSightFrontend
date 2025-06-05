
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname

export interface User {
  name: string;
  email: string;
  // imageUrl removed as per previous request
}

const mockUser: User = {
  name: 'Demo User',
  email: 'demo@example.com',
  // imageUrl removed
};

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Reflects initial auth check status
  const [initialAuthPerformed, setInitialAuthPerformed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navigateBasedOnSetup = useCallback(() => {
    const hasCompletedSetup = localStorage.getItem('foresight_hasCompletedSetup') === 'true';
    if (user) { // Only navigate if user is determined
      if (hasCompletedSetup) {
        if (pathname === '/welcome/setup' || pathname === '/login') {
          router.replace('/dashboard');
        }
      } else {
        if (pathname !== '/welcome/setup') {
          router.replace('/welcome/setup');
        }
      }
    }
  }, [user, router, pathname]);

  // Effect for initial authentication check
  useEffect(() => {
    const performInitialAuthCheck = async () => {
      // setIsLoading(true) is already the default state
      // Simulate API call for initial auth
      await new Promise(resolve => setTimeout(resolve, 750));
      
      const authStatus = localStorage.getItem('isLoggedInForesight');
      if (authStatus === 'true') {
        const storedUserString = localStorage.getItem('foresight_user');
        let resolvedUser = mockUser; // Default
        if (storedUserString) {
          try {
            resolvedUser = JSON.parse(storedUserString);
          } catch (e) { /* use mockUser as fallback */ }
        }
        setUser(resolvedUser);
      } else {
        setUser(null);
      }
      setIsLoading(false); // Initial auth check complete
      setInitialAuthPerformed(true);
    };

    if (!initialAuthPerformed) {
      performInitialAuthCheck();
    }
  }, [initialAuthPerformed]); // Only re-run if initialAuthPerformed changes

  // Effect for handling navigation and redirection based on auth and setup status
  useEffect(() => {
    // Don't do anything if initial auth hasn't been performed yet,
    // or if we are still in the process of the initial load (isLoading is true).
    if (!initialAuthPerformed || isLoading) {
      return;
    }

    if (user) { // User is authenticated
      navigateBasedOnSetup();
    } else { // User is not authenticated
      // Redirect to login if not on a public page (login or setup)
      if (pathname !== '/login' && pathname !== '/welcome/setup') {
        router.replace('/login');
      }
    }
  }, [user, initialAuthPerformed, isLoading, pathname, router, navigateBasedOnSetup]);

  const performLoginAction = useCallback(async (loggedInUser: User) => {
    // No setIsLoading(true) here; UI transition handled by Next.js router
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate login API call
    
    localStorage.setItem('isLoggedInForesight', 'true');
    localStorage.setItem('foresight_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    // If initialAuthPerformed was false, this login means auth state is now known.
    // If it was true, user state simply changes.
    if (!initialAuthPerformed) {
        setInitialAuthPerformed(true);
        setIsLoading(false); // Ensure isLoading is false if login completes initial auth
    }
    // Subsequent navigation is handled by the second useEffect reacting to `user` change.
  }, [initialAuthPerformed]);


  const login = useCallback(async () => {
    performLoginAction(mockUser);
  }, [performLoginAction]);

  const loginWithGitHub = useCallback(async () => {
    performLoginAction({...mockUser, name: "GitHub User", email: "github@example.com"});
  }, [performLoginAction]);


  const logout = useCallback(async () => {
    // No setIsLoading(true) here
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate logout API call
    localStorage.removeItem('isLoggedInForesight');
    localStorage.removeItem('foresight_user');
    localStorage.removeItem('foresight_hasCompletedSetup');
    setUser(null);
    // Auth state is now known (null). If initialAuthPerformed was false, it should become true.
    if (!initialAuthPerformed) {
        setInitialAuthPerformed(true);
        setIsLoading(false);
    }
    // Subsequent navigation to /login is handled by the second useEffect.
  }, [initialAuthPerformed]);

  return { user, isLoading, login, loginWithGitHub, logout };
}
