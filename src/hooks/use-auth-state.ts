
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
  hasCompletedSetup?: boolean | undefined; 
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

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const EXTERNAL_API_FIRST_CHECK_URL_BASE = `${backendUrl}/api/user/first-check`;

const addRandomQueryParam = (url: string, paramName: string = '_cb'): string => {
  const randomString = Math.random().toString(36).substring(2, 10);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${paramName}=${randomString}`;
};

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
    try {
      return await updateNextAuthSession(dataToUpdate);
    } catch (error) {
      console.error("useAuthState: Error updating NextAuth session:", error instanceof Error ? error.message : String(error));
      return null;
    }
  }, [updateNextAuthSession]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && session.user.hasCompletedSetup === undefined) {
      const userEmailForCheck = session.user.email;
      if (firstCheckInitiatedForUserRef.current !== userEmailForCheck && !isApiCheckInProgress) {
        firstCheckInitiatedForUserRef.current = userEmailForCheck;
        setIsApiCheckInProgress(true);
        const apiUrl = `${EXTERNAL_API_FIRST_CHECK_URL_BASE}?email=${encodeURIComponent(userEmailForCheck)}`;
        axios.get(addRandomQueryParam(apiUrl))
          .then(response => {
            if (response.data && typeof response.data.hasCompletedSetup === 'boolean') {
              updateSession({ user: { ...session.user, hasCompletedSetup: response.data.hasCompletedSetup } });
            } else {
              console.warn("useAuthState: API 'first-check' response did not include a boolean 'hasCompletedSetup'. Defaulting to false.");
              updateSession({ user: { ...session.user, hasCompletedSetup: false } });
            }
          })
          .catch(error => {
            console.error("useAuthState: API error calling 'first-check'. Defaulting hasCompletedSetup to false.");
            if (axios.isAxiosError(error) && error.response) {
                console.error("Backend error message:", error.response.data?.message || error.response.data?.error || "No specific message from backend.");
                console.error("Status code:", error.response.status);
            } else if (error instanceof Error) {
                console.error("Error details:", error.message);
            }
            updateSession({ user: { ...session.user, hasCompletedSetup: false } }); 
            firstCheckInitiatedForUserRef.current = null; 
          })
          .finally(() => {
            setIsApiCheckInProgress(false);
          });
      }
    } else if (status === 'unauthenticated') {
      firstCheckInitiatedForUserRef.current = null;
      if(isApiCheckInProgress) setIsApiCheckInProgress(false); 
    }
  }, [session, status, updateSession, isApiCheckInProgress]); 


  const navigateBasedOnAuthAndSetup = useCallback(() => {
    const isWaitingForAuth = isLoadingFromAuth;
    
    if (isWaitingForAuth || isApiCheckInProgress) { 
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
      setIsApiCheckInProgress(false); 
      const result = await signIn('google', { callbackUrl: '/dashboard', redirect: false });
      if (result?.url) router.push(result.url);
      else if (result?.error) console.error("NextAuth signIn error (Google):", result.error);
    } catch (error) {
      console.error("Catastrophic error during Google signIn:", error instanceof Error ? error.message : String(error));
    }
  }, [router]);

  const loginWithGitHub = useCallback(async () => {
    try {
      firstCheckInitiatedForUserRef.current = null; 
      setIsApiCheckInProgress(false); 
      const result = await signIn('github', { callbackUrl: '/dashboard', redirect: false });
      if (result?.url) router.push(result.url);
      else if (result?.error) console.error("NextAuth signIn error (GitHub):", result.error);
    } catch (error) {
      console.error("Catastrophic error during GitHub signIn:", error instanceof Error ? error.message : String(error));
    }
  }, [router]);

  const appLogout = useCallback(async () => {
    firstCheckInitiatedForUserRef.current = null;
    setIsApiCheckInProgress(false);
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
      console.error("Error during signOut:", error instanceof Error ? error.message : String(error));
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
