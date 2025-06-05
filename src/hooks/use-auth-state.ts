
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
      // console.log("useAuthState (navigate): Authenticated. Checking setup...");
      if (hasCompletedSetup) {
        if (pathname === '/login' || pathname === '/welcome/setup') {
          // console.log("useAuthState (navigate): Setup complete, on login/setup page, redirecting to /dashboard");
          router.replace('/dashboard');
        }
      } else {
        if (pathname !== '/welcome/setup') {
          // console.log("useAuthState (navigate): Setup incomplete, not on setup page, redirecting to /welcome/setup");
          router.replace('/welcome/setup');
        }
      }
    } else if (status === 'unauthenticated') {
      // console.log("useAuthState (navigate): Unauthenticated.");
      if (pathname !== '/login' && pathname !== '/welcome/setup') {
        // console.log("useAuthState (navigate): Unauthenticated, not on login/setup page, redirecting to /login. Current path:", pathname);
        router.replace('/login');
      }
    }
  }, [status, isLoading, pathname, router]);

  useEffect(() => {
    // console.log("useAuthState Effect: Status:", status, "Session User:", session?.user, "Pathname:", pathname, "IsLoading:", isLoading);
    navigateBasedOnAuthAndSetup();
  }, [status, session, pathname, isLoading, navigateBasedOnAuthAndSetup]);


  const loginWithGoogle = useCallback(async () => {
    try {
      console.log("Attempting Google login with callback to /welcome/setup");
      // Using /welcome/setup as callbackUrl as per original design for post-login flow
      const result = await signIn('google', { callbackUrl: '/welcome/setup' });
      if (result?.error) {
        console.error("NextAuth signIn error (Google):", result.error);
        // Potentially show a toast to the user here
        // Example: toast({ title: "Login Failed", description: result.error, variant: "destructive" });
      } else if (result?.ok && !result.error) {
        // console.log("Google signIn successful, result:", result);
        // Navigation will be handled by the useEffect watching session status
      } else {
        // console.log("Google signIn result (no error, but not explicitly ok or url):", result);
      }
    } catch (error) {
      console.error("Catastrophic error during Google signIn:", error);
      // Potentially show a toast to the user here
      // Example: toast({ title: "Login Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
  }, [router]); // Added router to dependency array if it's used for navigation inside

  const loginWithGitHub = useCallback(async () => {
    try {
      console.log("Attempting GitHub login with callback to /welcome/setup");
      const result = await signIn('github', { callbackUrl: '/welcome/setup' });
      if (result?.error) {
        console.error("NextAuth signIn error (GitHub):", result.error);
      } else if (result?.ok && !result.error) {
        // console.log("GitHub signIn successful, result:", result);
      } else {
        // console.log("GitHub signIn result (no error, but not explicitly ok or url):", result);
      }
    } catch (error) {
      console.error("Catastrophic error during GitHub signIn:", error);
    }
  }, [router]); // Added router to dependency array

  const appLogout = useCallback(async () => {
    console.log("Attempting logout: Clearing app data and redirecting to /login");

    // Clear application-specific localStorage items
    if (typeof window !== "undefined") {
      APP_LOCAL_STORAGE_KEYS.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`Removed ${key} from localStorage.`);
        } catch (e) {
          console.error(`Error removing ${key} from localStorage:`, e);
        }
      });
    }
    
    // Clear browser cache (limited capability, focuses on soft reload)
    // Note: Programmatically clearing all browser cache is not directly possible due to security restrictions.
    // This just ensures a fresh fetch of the login page assets.
    // For a more thorough cache clearing, users would need to do it manually via browser settings.

    // The signOut function from NextAuth.js will handle clearing its session cookies.
    try {
      await signOut({ callbackUrl: '/login', redirect: true }); // Ensure redirect happens
    } catch (error) {
      console.error("Error during signOut:", error);
      // Fallback redirect if signOut itself fails for some reason
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
