
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
    if (isLoading) return; // Don't navigate while session status is loading

    const hasCompletedSetup = localStorage.getItem('foresight_hasCompletedSetup') === 'true';

    if (status === 'authenticated') {
      // console.log("useAuthState: Authenticated. Checking setup...");
      if (hasCompletedSetup) {
        if (pathname === '/login' || pathname === '/welcome/setup') {
          // console.log("useAuthState: Setup complete, redirecting to /dashboard");
          router.replace('/dashboard');
        }
      } else {
        if (pathname !== '/welcome/setup') {
          // console.log("useAuthState: Setup incomplete, redirecting to /welcome/setup");
          router.replace('/welcome/setup');
        }
      }
    } else if (status === 'unauthenticated') {
      // console.log("useAuthState: Unauthenticated.");
      // Allow access to login and setup page even if unauthenticated (setup page handles its own auth check)
      if (pathname !== '/login' && pathname !== '/welcome/setup') {
        // console.log("useAuthState: Redirecting to /login because current path is:", pathname);
        router.replace('/login');
      }
    }
  }, [status, isLoading, pathname, router]);

  useEffect(() => {
    // console.log("useAuthState Effect: Status:", status, "User:", session?.user, "Pathname:", pathname, "IsLoading:", isLoading);
    navigateBasedOnAuthAndSetup();
  }, [status, session, pathname, isLoading, navigateBasedOnAuthAndSetup]);


  const loginWithGoogle = useCallback(async () => {
    console.log("Attempting Google login (default callback)");
    // Temporarily removed callbackUrl for debugging. NextAuth will use its default.
    await signIn('google'); 
  }, []);

  const loginWithGitHub = useCallback(async () => {
    console.log("Attempting GitHub login with callback to /welcome/setup");
    await signIn('github', { callbackUrl: '/welcome/setup' });
  }, []);

  const appLogout = useCallback(async () => {
    console.log("Attempting logout, redirecting to /login");
    localStorage.removeItem('foresight_hasCompletedSetup');
    await signOut({ callbackUrl: '/login' }); 
  }, []);

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
