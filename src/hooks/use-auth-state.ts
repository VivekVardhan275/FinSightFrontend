
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  name: string;
  email: string;
  imageUrl?: string;
}

const mockUser: User = {
  name: 'Demo User',
  email: 'demo@example.com',
  // Using a generic placeholder for avatar
  imageUrl: 'https://placehold.co/40x40.png',
};

// This is a simplified auth state management for client-side UI
// In a real app, this would integrate with an auth provider (e.g., Firebase, NextAuth.js)
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking auth status
    const authStatus = localStorage.getItem('isLoggedInForesight');
    if (authStatus === 'true') {
      setUser(mockUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.setItem('isLoggedInForesight', 'true');
    setUser(mockUser);
    setIsLoading(false);
    router.push('/dashboard');
  }, [router]);

  const loginWithGitHub = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call (same as Google for now)
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.setItem('isLoggedInForesight', 'true');
    setUser({...mockUser, name: "GitHub User", email: "github@example.com"}); // Slightly different mock user
    setIsLoading(false);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.removeItem('isLoggedInForesight');
    setUser(null);
    setIsLoading(false);
    router.push('/login');
  }, [router]);

  return { user, isLoading, login, loginWithGitHub, logout };
}
