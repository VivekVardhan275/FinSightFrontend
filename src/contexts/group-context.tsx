// src/contexts/group-context.tsx
"use client";

import type { Group } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import axios from 'axios';
import { useAuthState } from '@/hooks/use-auth-state';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const GROUP_API_URL = `${backendUrl}/api/user/group-expenses`;

const addRandomQueryParam = (url: string, paramName: string = '_cb'): string => {
  const randomString = Math.random().toString(36).substring(2, 10);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${paramName}=${randomString}`;
};

interface GroupContextType {
  groups: Group[];
  isLoading: boolean;
  addGroup: (group: Group) => void;
  updateGroup: (groupData: Group) => void;
  deleteGroup: (groupId: number) => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider = ({ children }: { children: ReactNode }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const { user, status: authStatus } = useAuthState();
  const [isLoading, setIsLoading] = useState(true);
  const fetchAttemptedForUserRef = useRef<string | null>(null);

  const userEmail = user?.email;

  useEffect(() => {
    if (authStatus === 'loading') {
      if (!isLoading) setIsLoading(true);
      return;
    }

    if (authStatus === 'unauthenticated') {
      setGroups([]);
      fetchAttemptedForUserRef.current = null;
      if (isLoading) setIsLoading(false);
      return;
    }

    if (userEmail) {
      if (fetchAttemptedForUserRef.current !== userEmail) {
        if (!isLoading) setIsLoading(true);
        fetchAttemptedForUserRef.current = userEmail;

        const apiUrl = `${GROUP_API_URL}?email=${encodeURIComponent(userEmail)}`;
        axios.get<Group[]>(addRandomQueryParam(apiUrl))
          .then(response => {
            setGroups(response.data || []);
          })
          .catch(error => {
            console.error("GroupContext: API error fetching groups.");
            if (axios.isAxiosError(error) && error.response) {
              console.error("Backend error message:", error.response.data?.message || error.response.data?.error || "No specific message from backend.");
              if (error.response.status !== 404) {
                fetchAttemptedForUserRef.current = null; // Allow retry for non-404 errors
              }
            } else {
              fetchAttemptedForUserRef.current = null; // Allow retry for other errors
            }
            setGroups([]);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        if (isLoading) setIsLoading(false);
      }
    } else {
      setGroups([]);
      fetchAttemptedForUserRef.current = null;
      if (isLoading) setIsLoading(false);
    }
  }, [userEmail, authStatus, isLoading]);

  const addGroup = useCallback((group: Group) => {
    setGroups(prev => [group, ...prev]);
  }, []);

  const updateGroup = useCallback((groupData: Group) => {
    setGroups(prev => prev.map(g => g.groupId === groupData.groupId ? groupData : g));
  }, []);

  const deleteGroup = useCallback((groupId: number) => {
    setGroups(prev => prev.filter(g => g.groupId !== groupId));
  }, []);

  return (
    <GroupContext.Provider value={{ groups, isLoading, addGroup, updateGroup, deleteGroup }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroupContext = (): GroupContextType => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroupContext must be used within a GroupProvider');
  }
  return context;
};
