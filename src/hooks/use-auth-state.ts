
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
    }
  }, [session, status, updateSession, isApiCheckInProgress]);


  const navigateBasedOnAuthAndSetup = useCallback(() => {
    // Determine if we are still waiting for critical information
    const isWaitingForAuth = isLoadingFromAuth;
    const isWaitingForApiCheck = status === 'authenticated' && user?.hasCompletedSetup === undefined && isApiCheckInProgress;

    if (isWaitingForAuth || isWaitingForApiCheck) {
      return; // Don't navigate yet, wait for critical info
    }

    if (status === 'authenticated') {
      if (user?.hasCompletedSetup === true) {
        // User is authenticated and setup is complete
        if (pathname === '/login' || pathname === '/welcome/setup') {
          router.replace('/dashboard');
        }
      } else if (user?.hasCompletedSetup === false) {
        // User is authenticated, but setup is NOT complete
        if (pathname !== '/welcome/setup') {
          router.replace('/welcome/setup');
        }
      }
      // If user.hasCompletedSetup is still undefined here (and isApiCheckInProgress is false),
      // it means the API check might have failed or the logic to update session didn't complete.
      // In this scenario, they would typically be stuck on the current page or redirected to setup as a fallback from session update.
    } else if (status === 'unauthenticated') {
      // User is not authenticated
      if (pathname !== '/login' && pathname !== '/welcome/setup') {
        router.replace('/login');
      }
    }
  }, [status, isLoadingFromAuth, user, pathname, router, isApiCheckInProgress]);

  useEffect(() => {
    navigateBasedOnAuthAndSetup();
  }, [navigateBasedOnAuthAndSetup]); // navigateBasedOnAuthAndSetup lists its own dependencies

  const loginWithGoogle = useCallback(async () => {
    try {
      firstCheckInitiatedForUserRef.current = null;
      // The callbackUrl will be hit, and then useAuthState will determine final redirection.
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
    firstCheckInitiatedForUserRef.current = null;
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

  // isLoading now reflects combined loading state: NextAuth session + API check for setup status
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
