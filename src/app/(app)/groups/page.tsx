// src/app/(app)/groups/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import type { Group, GroupExpenseFormData } from '@/types';
import { GroupExpenseFormDialog } from '@/components/groups/group-expense-form-dialog';
import { GroupCard } from '@/components/groups/group-card';
import { useAuthState } from '@/hooks/use-auth-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useGroupContext } from '@/contexts/group-context';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const GROUP_API_BASE_URL = `${backendUrl}/api/user`;

const addRandomQueryParam = (url: string, paramName: string = '_cb'): string => {
  const randomString = Math.random().toString(36).substring(2, 10);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${paramName}=${randomString}`;
};

const pageHeaderBlockMotionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const gridContainerMotionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
};

const emptyStateMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
};


export default function GroupsPage() {
  const { user } = useAuthState();
  const { toast } = useToast();
  const { groups, isLoading: isLoadingGroups, addGroup, updateGroup, deleteGroup: deleteGroupFromContext } = useGroupContext();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddGroup = () => {
    setEditingGroup(null);
    setIsFormOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setIsFormOpen(true);
  };

  const confirmDeleteGroup = (groupId: number) => {
    setGroupToDeleteId(groupId);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDeleteId || !user || !user.email) {
       toast({ title: "Error", description: "Cannot delete group. User or group ID missing.", variant: "destructive" });
       setIsConfirmDeleteDialogOpen(false);
       return;
    }
    setIsDeleting(true);

    try {
      const apiUrl = `${GROUP_API_BASE_URL}/group-expense/${groupToDeleteId}?email=${encodeURIComponent(user.email)}`;
      await axios.delete(addRandomQueryParam(apiUrl));
      deleteGroupFromContext(groupToDeleteId);
      toast({
        title: "Group Deleted",
        description: `The group has been successfully deleted.`,
      });
      setGroupToDeleteId(null);
    } catch (error) {
      console.error("API error deleting group.");
       let errorMessage = "Failed to delete group. Please try again.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
        console.error("Backend error message:", errorMessage);
        console.error("Status code:", error.response.status);
      } else if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      toast({
        title: "Error Deleting Group",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsConfirmDeleteDialogOpen(false);
    }
  };

  const handleSaveGroup = async (formData: GroupExpenseFormData) => {
    if (!user || !user.email) {
      toast({
        title: "Error",
        description: "You must be logged in to save a group.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const dataForApi = {
      groupName: formData.groupName,
      email: user.email,
      members: formData.members.map(m => m.name),
      expenses: formData.members.map(m => m.expense),
      balances: formData.members.map(m => m.balance),
      totalExpenses: formData.totalExpense,
    };

    const notificationAction = editingGroup ? "Updated" : "Created";

    try {
        let savedGroupFromApi: Group;

        if (editingGroup) {
            const apiUrl = `${GROUP_API_BASE_URL}/set-group-expense?id=${editingGroup.groupId}&email=${encodeURIComponent(user.email)}`;
            const response = await axios.put<Group>(addRandomQueryParam(apiUrl), dataForApi);
            savedGroupFromApi = response.data;
            updateGroup(savedGroupFromApi);
        } else {
            const apiUrl = `${GROUP_API_BASE_URL}/set-group-expense?email=${encodeURIComponent(user.email)}`;
            const response = await axios.post<Group>(addRandomQueryParam(apiUrl), dataForApi);
            savedGroupFromApi = response.data;
            addGroup(savedGroupFromApi);
        }

        toast({
            title: `Group ${notificationAction}`,
            description: `Group "${savedGroupFromApi.groupName}" successfully ${notificationAction.toLowerCase()}.`,
        });
        setIsFormOpen(false);
        setEditingGroup(null);
    } catch (error) {
        console.error(`API error ${notificationAction.toLowerCase()} group.`);
        let errorMessage = `Failed to ${notificationAction.toLowerCase()} group. Please try again.`;
        if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
            console.error("Backend error message:", errorMessage);
            console.error("Status code:", error.response.status);
        } else if (error instanceof Error) {
            console.error("Error details:", error.message);
        }
        toast({
            title: `Error ${notificationAction} Group`,
            description: errorMessage,
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <div className="space-y-8">
      <motion.div
        variants={pageHeaderBlockMotionVariants}
        initial="initial"
        animate="animate"
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Group Expenses
            </h1>
            <p className="text-muted-foreground">
              Manage your shared expenses with groups.
            </p>
          </div>
          <Button onClick={handleAddGroup}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Group
          </Button>
        </div>
      </motion.div>

      {isLoadingGroups ? (
        <div className="flex items-center justify-center p-10">
          <RotateCw className="mr-2 h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      ) : groups.length > 0 ? (
        <motion.div
            variants={gridContainerMotionVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
            {groups.map((group) => (
                <GroupCard
                    key={group.groupId}
                    group={group}
                    onEdit={handleEditGroup}
                    onDelete={confirmDeleteGroup}
                />
            ))}
        </motion.div>
      ) : (
         <motion.div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center"
          initial="initial"
          animate="animate"
          variants={emptyStateMotionVariants}
        >
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No groups yet</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Start by creating a group to track shared expenses.
            </p>
            <Button onClick={handleAddGroup}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Group
            </Button>
        </motion.div>
      )}

      <GroupExpenseFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveGroup}
        group={editingGroup}
        isSaving={isSaving}
      />

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this group expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGroupToDeleteId(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteGroup}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
            >
              {isDeleting && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
