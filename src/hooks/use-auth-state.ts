
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname

export interface User {
  name: string;
  email: string;
  imageUrl?: string;
}

const mockUser: User = {
  name: 'Demo User',
  email: 'demo@example.com',
  imageUrl: 'https://placehold.co/40x40.png',
};

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  const navigateBasedOnSetup = useCallback(() => {
    const hasCompletedSetup = localStorage.getItem('foresight_hasCompletedSetup') === 'true';
    if (hasCompletedSetup) {
      if (pathname === '/welcome/setup' || pathname === '/login') {
        router.replace('/dashboard');
      }
      // If already in app, no need to redirect again unless specifically from login/setup
    } else {
      if (pathname !== '/welcome/setup') {
        router.replace('/welcome/setup');
      }
    }
  }, [router, pathname]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      // SIMULATION (Current):
      const authStatusTimer = setTimeout(() => {
        const authStatus = localStorage.getItem('isLoggedInForesight');
        if (authStatus === 'true') {
          const storedUser = localStorage.getItem('foresight_user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              setUser(mockUser); // Fallback
              localStorage.setItem('foresight_user', JSON.stringify(mockUser));
            }
          } else {
            setUser(mockUser);
            localStorage.setItem('foresight_user', JSON.stringify(mockUser));
          }
          navigateBasedOnSetup();
        } else {
          setUser(null);
          if (pathname !== '/login' && !pathname.startsWith('/welcome')) { // Don't redirect if already on login or setup
            router.replace('/login');
          }
        }
        setIsLoading(false);
      }, 750);
      return () => clearTimeout(authStatusTimer);
    };

    checkAuthStatus();
  }, [navigateBasedOnSetup, router, pathname]); // Added router and pathname

  const performLogin = useCallback(async (loggedInUser: User) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    
    localStorage.setItem('isLoggedInForesight', 'true');
    localStorage.setItem('foresight_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setIsLoading(false);

    // For testing setup flow easily, uncomment next line to always force setup on login
    // localStorage.removeItem('foresight_hasCompletedSetup'); 
    
    const hasCompletedSetup = localStorage.getItem('foresight_hasCompletedSetup') === 'true';
    if (hasCompletedSetup) {
      router.push('/dashboard');
    } else {
      router.push('/welcome/setup');
    }
  }, [router]);


  const login = useCallback(async () => {
    // REAL BACKEND INTEGRATION (Example for Google OAuth):
    // try {
    //   // window.location.href = '/api/auth/google/login'; // Redirect to backend
    // } catch (error) {
    //   console.error("Google Login error:", error);
    //   setIsLoading(false); // Ensure loading is false on error
    // }
    
    // SIMULATION
    performLogin(mockUser);
  }, [performLogin]);

  const loginWithGitHub = useCallback(async () => {
    // REAL BACKEND INTEGRATION (Example for GitHub OAuth):
    // try {
    //   // window.location.href = '/api/auth/github/login'; // Redirect to backend
    // } catch (error) {
    //   console.error("GitHub Login error:", error);
    //   setIsLoading(false); // Ensure loading is false on error
    // }

    // SIMULATION
    performLogin({...mockUser, name: "GitHub User", email: "github@example.com"});
  }, [performLogin]);


  const logout = useCallback(async () => {
    setIsLoading(true);
    // REAL BACKEND INTEGRATION (Example):
    // try {
    //   await fetch('/api/auth/logout', { method: 'POST' });
    // } catch (error) {
    //   console.error("Logout error:", error);
    // } finally {
    //   localStorage.removeItem('isLoggedInForesight');
    //   localStorage.removeItem('foresight_user');
    //   localStorage.removeItem('foresight_hasCompletedSetup'); // Also clear setup flag on logout
    //   setUser(null);
    //   setIsLoading(false);
    //   router.push('/login');
    // }

    // SIMULATION (Current):
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.removeItem('isLoggedInForesight');
    localStorage.removeItem('foresight_user'); // Clear stored user
    localStorage.removeItem('foresight_hasCompletedSetup'); // Clear setup status on logout
    setUser(null);
    setIsLoading(false);
    router.push('/login');
  }, [router]);

  return { user, isLoading, login, loginWithGitHub, logout };
}

    