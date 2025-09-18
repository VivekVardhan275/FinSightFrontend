
// src/app/(app)/groups/page.tsx
"use client";

import React, { useState } from 'react';
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
import { useNotification } from '@/contexts/notification-context';
import { GroupProvider, useGroupContext } from '@/contexts/group-context';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const GROUP_API_BASE_URL = `${backendUrl}/api/user`;

const addRandomQueryParam = (url: string, paramName: string = '_cb'): string => {
  const randomString = Math.random().toString(36).substring(2, 10);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${paramName}=${randomString}`;
};

const buttonMotionVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.2 } },
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

function GroupsPageContent() {
  const { user } = useAuthState();
  const { addNotification } = useNotification();
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
       addNotification({ title: "Error", description: "Cannot delete group. User or group ID missing.", type: "error" });
       setIsConfirmDeleteDialogOpen(false);
       return;
    }
    setIsDeleting(true);

    try {
      const apiUrl = `${GROUP_API_BASE_URL}/group-expense?id=${groupToDeleteId}&email=${encodeURIComponent(user.email)}`;
      await axios.delete(addRandomQueryParam(apiUrl));
      deleteGroupFromContext(groupToDeleteId);
      addNotification({
        title: "Group Deleted",
        description: `The group has been successfully deleted.`,
        type: "info",
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
      addNotification({
        title: "Error Deleting Group",
        description: errorMessage,
        type: "error",
      });
    } finally {
      setIsDeleting(false);
      setIsConfirmDeleteDialogOpen(false);
    }
  };

  const handleSaveGroup = async (formData: GroupExpenseFormData) => {
    if (!user || !user.email) {
      addNotification({
        title: "Error",
        description: "You must be logged in to save a group.",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    
    // Calculate balances before sending to API
    const totalMembers = formData.members.length;
    const sharePerMember = totalMembers > 0 ? formData.totalExpense / totalMembers : 0;
    
    const membersWithBalances = formData.members.map(member => ({
      ...member,
      balance: member.expense - sharePerMember,
    }));

    const dataForApi = {
      groupName: formData.groupName,
      email: user.email,
      members: membersWithBalances.map(m => m.name),
      expenses: membersWithBalances.map(m => m.expense),
      balances: membersWithBalances.map(m => m.balance),
      totalExpenses: formData.totalExpense,
    };

    const isEditing = editingGroup !== null;
    const notificationAction = isEditing ? "Updated" : "Created";

    try {
        let savedGroupFromApi: Group;

        if (isEditing) {
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

        addNotification({
            title: `Group ${notificationAction}`,
            description: `Group "${savedGroupFromApi.groupName}" successfully ${notificationAction.toLowerCase()}.`,
            type: 'success',
            href: '/groups'
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
        addNotification({
            title: `Error ${notificationAction} Group`,
            description: errorMessage,
            type: 'error',
        });
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
                Group Expenses
            </h1>
            <p className="text-muted-foreground">
                Manage your shared expenses with groups.
            </p>
        </div>
        <motion.div initial="initial" animate="animate" variants={buttonMotionVariants} viewport={{ once: true }}>
            <Button onClick={handleAddGroup} disabled={isLoadingGroups}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Group
            </Button>
        </motion.div>
      </div>

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
            viewport={{ once: true }}
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
          viewport={{ once: true }}
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


export default function GroupsPage() {
  return (
    <GroupProvider>
      <GroupsPageContent />
    </GroupProvider>
  )
}
