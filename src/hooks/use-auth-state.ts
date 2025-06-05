
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

  useEffect(() => {
    // Simulate checking auth status with a backend
    const checkAuthStatus = async () => {
      setIsLoading(true);
      // // REAL BACKEND INTEGRATION (Example):
      // try {
      //   const response = await fetch('/api/auth/session'); // Or your session/me endpoint
      //   if (response.ok) {
      //     const userData = await response.json();
      //     setUser(userData);
      //   } else {
      //     setUser(null); // No active session
      //   }
      // } catch (error) {
      //   console.error('Failed to fetch auth session:', error);
      //   setUser(null);
      // } finally {
      //   setIsLoading(false);
      // }

      // SIMULATION (Current):
      const authStatusTimer = setTimeout(() => {
        const authStatus = localStorage.getItem('isLoggedInForesight');
        if (authStatus === 'true') {
          setUser(mockUser);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }, 750);
      return () => clearTimeout(authStatusTimer);
    };

    checkAuthStatus();
  }, []);

  const login = useCallback(async () => {
    setIsLoading(true);
    // // REAL BACKEND INTEGRATION (Example for Google OAuth):
    // // This would typically involve redirecting to your backend, which then redirects to Google.
    // // Or, if using a library like NextAuth.js, you'd call its signIn('google') method.
    // try {
    //   // Option 1: Redirect to a backend endpoint that initiates OAuth
    //   // window.location.href = '/api/auth/google/login';
    //
    //   // Option 2: If backend handles it and returns user data directly after client-side provider popup (less common for pure OAuth2 backend)
    //   // const response = await fetch('/api/auth/google/callback-handler', { method: 'POST', /* ... */ });
    //   // if (!response.ok) throw new Error('Login failed');
    //   // const userData = await response.json();
    //   // setUser(userData);
    //   // localStorage.setItem('isLoggedInForesight', 'true'); // Or manage session via httpOnly cookie from backend
    //   // router.push('/dashboard');
    // } catch (error) {
    //   console.error("Google Login error:", error);
    //   // Handle login error (e.g., show a toast)
    // } finally {
    //   setIsLoading(false);
    // }

    // SIMULATION (Current):
    await new Promise(resolve => setTimeout(resolve, 1500));
    localStorage.setItem('isLoggedInForesight', 'true');
    setUser(mockUser);
    setIsLoading(false);
    router.push('/dashboard');
  }, [router]);

  const loginWithGitHub = useCallback(async () => {
    setIsLoading(true);
    // // REAL BACKEND INTEGRATION (Example for GitHub OAuth):
    // // Similar to Google, this would typically involve your backend.
    // try {
    //   // window.location.href = '/api/auth/github/login';
    // } catch (error) {
    //   console.error("GitHub Login error:", error);
    // } finally {
    //   setIsLoading(false);
    // }

    // SIMULATION (Current):
    await new Promise(resolve => setTimeout(resolve, 1500));
    localStorage.setItem('isLoggedInForesight', 'true');
    setUser({...mockUser, name: "GitHub User", email: "github@example.com"});
    setIsLoading(false);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    // // REAL BACKEND INTEGRATION (Example):
    // try {
    //   // await fetch('/api/auth/logout', { method: 'POST' });
    //   // setUser(null);
    //   // localStorage.removeItem('isLoggedInForesight'); // If frontend needs to clear something
    //   // router.push('/login');
    // } catch (error) {
    //   console.error("Logout error:", error);
    //   // Handle logout error
    // } finally {
    //   setIsLoading(false);
    // }

    // SIMULATION (Current):
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.removeItem('isLoggedInForesight');
    setUser(null);
    setIsLoading(false);
    router.push('/login');
  }, [router]);

  return { user, isLoading, login, loginWithGitHub, logout };
}
