
"use client";

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import type { User as NextAuthUser, Session } from 'next-auth';

export interface AppUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  hasCompletedSetup?: boolean; // Added to our AppUser type
}

// Remove 'foresight_hasCompletedSetup' as it's now managed in the session
const APP_LOCAL_STORAGE_KEYS = [
  'app-transactions',
  'app-budgets',
  'app-notifications',
  'app-currency',
  'app-theme',
  'app-font-size',
  'app-layout-notified-budgets',
  'sidebar_state',
];

export function useAuthState() {
  const { data: session, status, update: updateNextAuthSession } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isLoading = status === 'loading';
  
  const user: AppUser | null = session?.user ? {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    hasCompletedSetup: session.user.hasCompletedSetup, // Populate from augmented session
  } : null;

  const navigateBasedOnAuthAndSetup = useCallback(() => {
    if (isLoading) return;

    const currentSessionUser = session?.user;
    const setupCompleted = currentSessionUser?.hasCompletedSetup === true;

    if (status === 'authenticated') {
      if (setupCompleted) {
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
        // Allow access to /welcome/setup if attempting to complete setup post-auth failure or similar edge cases
        // but generally, should be on /login if unauthenticated.
        // If on /welcome/setup and unauthenticated, might be mid-redirect from OAuth provider.
        if (pathname !== '/welcome/setup') {
             router.replace('/login');
        }
      }
    }
  }, [status, isLoading, pathname, router, session]); // Added session to dependencies

  useEffect(() => {
    navigateBasedOnAuthAndSetup();
  }, [navigateBasedOnAuthAndSetup]); // navigateBasedOnAuthAndSetup includes all its own dependencies

  const loginWithGoogle = useCallback(async () => {
    try {
      // Redirect to /welcome/setup, which will then check session's hasCompletedSetup
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
      router.push('/login'); // Fallback redirect
    }
  }, [router]);

  const updateSession = useCallback(async (dataToUpdate: Partial<Session['user']>) => {
    return updateNextAuthSession(dataToUpdate);
  }, [updateNextAuthSession]);

  return {
    user,
    isLoading,
    loginWithGoogle,
    loginWithGitHub,
    logout: appLogout,
    isAuthenticated: status === 'authenticated',
    status,
    updateSession, // Expose the update function
  };
}

    