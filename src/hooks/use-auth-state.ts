
"use client";

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import type { User as NextAuthUser } from 'next-auth'; // Using NextAuth's User type

// Define our app's User type, which might be a subset or extension of NextAuth's
export interface AppUser {
  name?: string | null;
  email?: string | null;
  image?: string | null; // NextAuth user includes image
  // Add any other custom fields you expect in your app's user object
}

const APP_LOCAL_STORAGE_KEYS = [
  'app-transactions',
  'app-budgets',
  'app-notifications',
  'app-currency',
  'app-theme',
  'app-font-size',
  'foresight_hasCompletedSetup',
  'app-layout-notified-budgets',
  'sidebar_state', // From SidebarProvider
  // Add any other app-specific keys here if introduced later
];

export function useAuthState() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isLoading = status === 'loading';
  const user: AppUser | null = session?.user ? {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  } : null;


  const navigateBasedOnAuthAndSetup = useCallback(() => {
    if (isLoading) return; 

    const hasCompletedSetup = localStorage.getItem('foresight_hasCompletedSetup') === 'true';

    if (status === 'authenticated') {
      if (hasCompletedSetup) {
        if (pathname === '/login' || pathname === '/welcome/setup') {
          router.replace('/dashboard');
        }
      } else {
        if (pathname !== '/welcome/setup') {
          router.replace('/welcome/setup');
        }
      }
    } else if (status === 'unauthenticated') {
      if (pathname !== '/login' && pathname !== '/welcome/setup') {
        router.replace('/login');
      }
    }
  }, [status, isLoading, pathname, router]);

  useEffect(() => {
    navigateBasedOnAuthAndSetup();
  }, [status, session, pathname, isLoading, navigateBasedOnAuthAndSetup]);


  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signIn('google', { callbackUrl: '/welcome/setup' });
      if (result?.error) {
        console.error("NextAuth signIn error (Google):", result.error);
      }
    } catch (error) {
      console.error("Catastrophic error during Google signIn:", error);
    }
  }, []); 

  const loginWithGitHub = useCallback(async () => {
    try {
      const result = await signIn('github', { callbackUrl: '/welcome/setup' });
      if (result?.error) {
        console.error("NextAuth signIn error (GitHub):", result.error);
      }
    } catch (error) {
      console.error("Catastrophic error during GitHub signIn:", error);
    }
  }, []); 

  const appLogout = useCallback(async () => {
    if (typeof window !== "undefined") {
      APP_LOCAL_STORAGE_KEYS.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Error removing ${key} from localStorage:`, e);
        }
      });
    }
    
    try {
      await signOut({ callbackUrl: '/login', redirect: true }); 
    } catch (error) {
      console.error("Error during signOut:", error);
      router.push('/login');
    }
  }, [router]);

  return { 
    user, 
    isLoading, 
    loginWithGoogle,
    loginWithGitHub, 
    logout: appLogout,
    isAuthenticated: status === 'authenticated',
    status
  };
}
