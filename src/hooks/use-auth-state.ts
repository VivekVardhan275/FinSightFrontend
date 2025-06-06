
"use client";

import { useEffect, useCallback, useState, useRef } from 'react';
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
  const firstCheckInitiatedForUserRef = useRef<string | null>(null);

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
      if (firstCheckInitiatedForUserRef.current !== session.user.email && !isApiCheckInProgress) {
        firstCheckInitiatedForUserRef.current = session.user.email;
        setIsApiCheckInProgress(true);
        axios.get(`${EXTERNAL_API_FIRST_CHECK_URL}?email=${encodeURIComponent(session.user.email)}`)
          .then(response => {
            if (response.data && typeof response.data.hasCompletedSetup === 'boolean') {
              updateSession({ user: { ...session.user, hasCompletedSetup: response.data.hasCompletedSetup } });
            } else {
              // Fallback if API response is not as expected
              updateSession({ user: { ...session.user, hasCompletedSetup: false } });
            }
          })
          .catch(error => {
            console.error("Error calling 'first-check' API:", error);
            // On error, assume setup is not complete to guide user appropriately
            updateSession({ user: { ...session.user, hasCompletedSetup: false } });
            firstCheckInitiatedForUserRef.current = null; // Allow retry on next evaluation if API fails
          })
          .finally(() => {
            setIsApiCheckInProgress(false);
          });
      }
    } else if (status === 'unauthenticated') {
      // Reset the ref if user becomes unauthenticated (e.g., session expires, explicit logout)
      firstCheckInitiatedForUserRef.current = null;
    }
  }, [session, status, updateSession, isApiCheckInProgress]);


  const navigateBasedOnAuthAndSetup = useCallback(() => {
    const isWaitingForAuth = isLoadingFromAuth;
    const isWaitingForApiCheck = status === 'authenticated' && user?.hasCompletedSetup === undefined && isApiCheckInProgress;

    if (isWaitingForAuth || isWaitingForApiCheck) {
      return; 
    }

    if (status === 'authenticated') {
      if (user?.hasCompletedSetup === true) {
        if (pathname === '/login' || pathname === '/welcome/setup') {
          router.replace('/dashboard');
        }
      } else if (user?.hasCompletedSetup === false) {
        if (pathname !== '/welcome/setup') {
          router.replace('/welcome/setup');
        }
      }
    } else if (status === 'unauthenticated') {
      if (pathname !== '/login' && pathname !== '/welcome/setup') { // Allow access to setup page if someone has a direct link but is unauth
        router.replace('/login');
      }
    }
  }, [status, isLoadingFromAuth, user, pathname, router, isApiCheckInProgress]);

  useEffect(() => {
    navigateBasedOnAuthAndSetup();
  }, [navigateBasedOnAuthAndSetup]);

  const loginWithGoogle = useCallback(async () => {
    try {
      firstCheckInitiatedForUserRef.current = null;
      const result = await signIn('google', { callbackUrl: '/dashboard', redirect: false });
      if (result?.url) router.push(result.url); 
      else if (result?.error) console.error("NextAuth signIn error (Google):", result.error);
    } catch (error) {
      console.error("Catastrophic error during Google signIn:", error);
    }
  }, [router]);

  const loginWithGitHub = useCallback(async () => {
    try {
      firstCheckInitiatedForUserRef.current = null;
      const result = await signIn('github', { callbackUrl: '/dashboard', redirect: false });
      if (result?.url) router.push(result.url); 
      else if (result?.error) console.error("NextAuth signIn error (GitHub):", result.error);
    } catch (error) {
      console.error("Catastrophic error during GitHub signIn:", error);
    }
  }, [router]);

  const appLogout = useCallback(async () => {
    firstCheckInitiatedForUserRef.current = null; // Reset fetch attempt flag
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
      // callbackUrl ensures user is redirected to login page after sign out completes
      await signOut({ callbackUrl: '/login', redirect: true });
    } catch (error) {
      console.error("Error during signOut:", error);
      // Fallback redirect if signOut itself fails to redirect
      router.push('/login');
    }
  }, [router]);

  const combinedIsLoading = isLoadingFromAuth || (status === 'authenticated' && user?.hasCompletedSetup === undefined && isApiCheckInProgress);

  return {
    user,
    isLoading: combinedIsLoading,
    loginWithGoogle,
    loginWithGitHub,
    logout: appLogout,
    isAuthenticated: status === 'authenticated',
    status,
    updateSession,
  };
}
