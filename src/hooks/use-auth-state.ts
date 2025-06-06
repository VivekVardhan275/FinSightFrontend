
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
      const userEmailForCheck = session.user.email;
      // Primary guard: only proceed if this check hasn't been initiated for the current user email
      // AND an API call isn't already in progress (secondary guard for rapid re-renders before ref updates)
      if (firstCheckInitiatedForUserRef.current !== userEmailForCheck && !isApiCheckInProgress) {
        firstCheckInitiatedForUserRef.current = userEmailForCheck;
        setIsApiCheckInProgress(true);
        axios.get(`${EXTERNAL_API_FIRST_CHECK_URL}?email=${encodeURIComponent(userEmailForCheck)}`)
          .then(response => {
            if (response.data && typeof response.data.hasCompletedSetup === 'boolean') {
              updateSession({ user: { ...session.user, hasCompletedSetup: response.data.hasCompletedSetup } });
            } else {
              updateSession({ user: { ...session.user, hasCompletedSetup: false } });
            }
          })
          .catch(error => {
            console.error("Error calling 'first-check' API:", error);
            updateSession({ user: { ...session.user, hasCompletedSetup: false } });
            firstCheckInitiatedForUserRef.current = null; 
          })
          .finally(() => {
            setIsApiCheckInProgress(false);
          });
      }
    } else if (status === 'unauthenticated') {
      firstCheckInitiatedForUserRef.current = null;
      if(isApiCheckInProgress) setIsApiCheckInProgress(false); // Reset if user logs out during check
    }
  // Removed isApiCheckInProgress from dependency array.
  // updateSession is memoized. session and status are from next-auth and should be stable unless auth state changes.
  }, [session, status, updateSession]);


  const navigateBasedOnAuthAndSetup = useCallback(() => {
    const isWaitingForAuth = isLoadingFromAuth;
    // Condition for waiting: Auth is loading OR user is authenticated but setup status is unknown AND API check is active
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
      // If user.hasCompletedSetup is still undefined here, it means API check finished but didn't set it (edge case)
      // or API check never ran (e.g. userEmail was null). Defaulting to setup page might be safest.
      // However, the earlier `isWaitingForApiCheck` should mostly cover this.
    } else if (status === 'unauthenticated') {
      if (pathname !== '/login' && pathname !== '/welcome/setup') { 
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
      setIsApiCheckInProgress(false); // Reset before sign-in attempt
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
      setIsApiCheckInProgress(false); // Reset before sign-in attempt
      const result = await signIn('github', { callbackUrl: '/dashboard', redirect: false });
      if (result?.url) router.push(result.url); 
      else if (result?.error) console.error("NextAuth signIn error (GitHub):", result.error);
    } catch (error) {
      console.error("Catastrophic error during GitHub signIn:", error);
    }
  }, [router]);

  const appLogout = useCallback(async () => {
    firstCheckInitiatedForUserRef.current = null; 
    setIsApiCheckInProgress(false); // Reset on logout
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

  // isLoading now reflects:
  // 1. NextAuth session is loading OR
  // 2. User is authenticated, hasCompletedSetup is still undefined (meaning API call pending or in progress), AND the API call is marked as in progress.
  const combinedIsLoading = isLoadingFromAuth || (status === 'authenticated' && user?.hasCompletedSetup === undefined && isApiCheckInProgress);

  return {
    user,
    isLoading: combinedIsLoading,
    loginWithGoogle,
    loginWithGitHub,
    logout: appLogout,
    isAuthenticated: status === 'authenticated',
    status, // Expose raw status for more granular checks if needed
    updateSession,
  };
}
