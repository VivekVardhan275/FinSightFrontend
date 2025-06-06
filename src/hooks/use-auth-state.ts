
"use client";

import { useEffect, useCallback, useState, useRef } from 'react'; // Added useRef
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import axios from 'axios';

export interface AppUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  hasCompletedSetup?: boolean | undefined; // Can be undefined until fetched
}

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

const EXTERNAL_API_FIRST_CHECK_URL = "http://localhost:8080/api/user/first-check";

export function useAuthState() {
  const { data: session, status, update: updateNextAuthSession } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isApiCheckInProgress, setIsApiCheckInProgress] = useState(false);
  const firstCheckInitiatedForUserRef = useRef<string | null>(null); // Ref to track user email for whom check was done

  const isLoadingFromAuth = status === 'loading';
  
  const user: AppUser | null = session?.user ? {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    hasCompletedSetup: session.user.hasCompletedSetup,
  } : null;

  const updateSession = useCallback(async (dataToUpdate: Partial<Session['user']>) => {
    return updateNextAuthSession(dataToUpdate);
  }, [updateNextAuthSession]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && session.user.hasCompletedSetup === undefined) {
      // Only proceed if first check hasn't been initiated for *this specific user's email* or if API not already in progress
      if (firstCheckInitiatedForUserRef.current !== session.user.email && !isApiCheckInProgress) {
        firstCheckInitiatedForUserRef.current = session.user.email; // Mark as initiated for this user
        setIsApiCheckInProgress(true);
        axios.get(`${EXTERNAL_API_FIRST_CHECK_URL}?email=${encodeURIComponent(session.user.email)}`)
          .then(response => {
            if (response.data && typeof response.data.hasCompletedSetup === 'boolean') {
              updateSession({ user: { ...session.user, hasCompletedSetup: response.data.hasCompletedSetup } });
            } else {
              // If API response is malformed, default to false to ensure setup flow
              updateSession({ user: { ...session.user, hasCompletedSetup: false } });
            }
          })
          .catch(error => {
            console.error("Error calling 'first-check' API:", error);
            updateSession({ user: { ...session.user, hasCompletedSetup: false } }); // Default to setup incomplete on API error
            firstCheckInitiatedForUserRef.current = null; // Allow retry on error for this user if they re-auth or page reloads
          })
          .finally(() => {
            setIsApiCheckInProgress(false);
          });
      }
    } else if (status === 'unauthenticated') {
      firstCheckInitiatedForUserRef.current = null; // Reset ref on logout
    }
  }, [session, status, updateSession, isApiCheckInProgress]); // isApiCheckInProgress is kept here to allow the .finally to re-evaluate if needed


  const navigateBasedOnAuthAndSetup = useCallback(() => {
    if (isLoadingFromAuth || (isApiCheckInProgress && user?.hasCompletedSetup === undefined)) {
      return;
    }

    const setupCompleted = user?.hasCompletedSetup === true;

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
         if (pathname !== '/welcome/setup') {
             router.replace('/login');
        }
      }
    }
  }, [status, isLoadingFromAuth, pathname, router, user, isApiCheckInProgress]);

  useEffect(() => {
    navigateBasedOnAuthAndSetup();
  }, [navigateBasedOnAuthAndSetup]);

  const loginWithGoogle = useCallback(async () => {
    try {
      firstCheckInitiatedForUserRef.current = null; // Reset check flag before new login attempt
      const result = await signIn('google', { callbackUrl: '/welcome/setup', redirect: false });
      if (result?.url) router.push(result.url); 
      else if (result?.error) console.error("NextAuth signIn error (Google):", result.error);
    } catch (error) {
      console.error("Catastrophic error during Google signIn:", error);
    }
  }, [router]);

  const loginWithGitHub = useCallback(async () => {
    try {
      firstCheckInitiatedForUserRef.current = null; // Reset check flag before new login attempt
      const result = await signIn('github', { callbackUrl: '/welcome/setup', redirect: false });
      if (result?.url) router.push(result.url); 
      else if (result?.error) console.error("NextAuth signIn error (GitHub):", result.error);
    } catch (error) {
      console.error("Catastrophic error during GitHub signIn:", error);
    }
  }, [router]);

  const appLogout = useCallback(async () => {
    firstCheckInitiatedForUserRef.current = null; // Reset check flag
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
    isLoading: isLoadingFromAuth || (status === 'authenticated' && user?.hasCompletedSetup === undefined && isApiCheckInProgress),
    loginWithGoogle,
    loginWithGitHub,
    logout: appLogout,
    isAuthenticated: status === 'authenticated',
    status,
    updateSession,
  };
}
