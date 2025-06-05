
"use client";

import { useEffect, useCallback, useState } from 'react';
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
  // 'foresight_hasCompletedSetup', // No longer used
];

const EXTERNAL_API_FIRST_CHECK_URL = "http://localhost:8080/api/users/first-check";

export function useAuthState() {
  const { data: session, status, update: updateNextAuthSession } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isApiCheckInProgress, setIsApiCheckInProgress] = useState(false);

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
    if (status === 'authenticated' && session?.user?.email && session.user.hasCompletedSetup === undefined && !isApiCheckInProgress) {
      setIsApiCheckInProgress(true);
      axios.get(`${EXTERNAL_API_FIRST_CHECK_URL}?email=${encodeURIComponent(session.user.email)}`)
        .then(response => {
          if (response.data && typeof response.data.hasCompletedSetup === 'boolean') {
            updateSession({ user: { ...session.user, hasCompletedSetup: response.data.hasCompletedSetup } });
          } else {
            console.warn("API 'first-check' did not return expected boolean for hasCompletedSetup, defaulting to false.", response.data);
            updateSession({ user: { ...session.user, hasCompletedSetup: false } });
          }
        })
        .catch(error => {
          console.error("Error calling 'first-check' API:", error);
          updateSession({ user: { ...session.user, hasCompletedSetup: false } }); // Default to setup incomplete on API error
        })
        .finally(() => {
          setIsApiCheckInProgress(false);
        });
    }
  }, [session, status, updateSession, isApiCheckInProgress]);


  const navigateBasedOnAuthAndSetup = useCallback(() => {
    // Do not navigate if auth is loading, or API check is in progress and setup status is unknown
    if (isLoadingFromAuth || (isApiCheckInProgress && user?.hasCompletedSetup === undefined)) {
      return;
    }

    const setupCompleted = user?.hasCompletedSetup === true;

    if (status === 'authenticated') {
      if (setupCompleted) {
        if (pathname === '/login' || pathname === '/welcome/setup') {
          router.replace('/dashboard');
        }
      } else { // setupCompleted is false or undefined (and API check is done)
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
      const result = await signIn('google', { callbackUrl: '/welcome/setup', redirect: false });
      if (result?.url) router.push(result.url); // Manually redirect if redirect:false
      else if (result?.error) console.error("NextAuth signIn error (Google):", result.error);
    } catch (error) {
      console.error("Catastrophic error during Google signIn:", error);
    }
  }, [router]);

  const loginWithGitHub = useCallback(async () => {
    try {
      const result = await signIn('github', { callbackUrl: '/welcome/setup', redirect: false });
      if (result?.url) router.push(result.url); // Manually redirect if redirect:false
      else if (result?.error) console.error("NextAuth signIn error (GitHub):", result.error);
    } catch (error) {
      console.error("Catastrophic error during GitHub signIn:", error);
    }
  }, [router]);

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
    isLoading: isLoadingFromAuth || (status === 'authenticated' && user?.hasCompletedSetup === undefined && isApiCheckInProgress), // Overall loading state
    loginWithGoogle,
    loginWithGitHub,
    logout: appLogout,
    isAuthenticated: status === 'authenticated',
    status,
    updateSession,
  };
}
