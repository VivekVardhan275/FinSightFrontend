
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import type { GroupExpense, GroupExpenseSubmitData } from '@/types';
import { GroupCard } from '@/components/groups/group-card';
import { GroupCardSkeleton } from '@/components/groups/group-card-skeleton';
import { GroupExpenseFormDialog } from '@/components/groups/group-expense-form-dialog';
import { useNotification } from '@/contexts/notification-context';
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
import {
  fetchGroupExpenses,
  createGroupExpense,
  updateGroupExpense,
  deleteGroupExpense
} from '@/services/group-expense.service';

// --- Animation Variants ---

const buttonMotionVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.2 } },
};

const gridContainerMotionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const groupCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const emptyStateMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
};


// --- Main Component ---

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupExpense | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);
  const { addNotification } = useNotification();

  const getGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedGroups = await fetchGroupExpenses();
      setGroups(fetchedGroups);
    } catch (error) {
      addNotification({
        title: "Error Loading Groups",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    getGroups();
  }, [getGroups]);

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setIsFormOpen(true);
  };

  const handleEditGroup = (group: GroupExpense) => {
    setEditingGroup(group);
    setIsFormOpen(true);
  };

  const confirmDeleteGroup = (groupId: string) => {
    setGroupToDeleteId(groupId);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDeleteId) return;

    setIsSubmitting(true); 
    try {
      await deleteGroupExpense(groupToDeleteId);
      addNotification({
        title: "Group Deleted",
        description: `The group has been successfully removed.`,
        type: 'info'
      });
      await getGroups();
    } catch (error) {
      addNotification({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Could not delete group.",
        type: 'error'
      });
    } finally {
      setIsConfirmDeleteDialogOpen(false);
      setGroupToDeleteId(null);
      setIsSubmitting(false);
    }
  };

  const handleSaveGroup = async (data: GroupExpenseSubmitData) => {
    setIsSubmitting(true);
    try {
      if (editingGroup) {
        await updateGroupExpense(editingGroup.id, data);
        addNotification({
          title: "Group Updated",
          description: `Data for "${data.groupName}" has been updated.`,
          type: 'success'
        });
      } else {
        await createGroupExpense(data);
        addNotification({
          title: "Group Created",
          description: `A new group "${data.groupName}" has been created.`,
          type: 'success'
        });
      }
      setIsFormOpen(false);
      setEditingGroup(null);
      await getGroups();
    } catch (error) {
      addNotification({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Could not save the group.",
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <GroupCardSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (groups.length > 0) {
      return (
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={gridContainerMotionVariants}
          initial="hidden"
          animate="visible"
        >
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onEdit={handleEditGroup}
              onDelete={confirmDeleteGroup}
              variants={groupCardVariants}
            />
          ))}
        </motion.div>
      );
    }

    return (
      <motion.div
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center"
        variants={emptyStateMotionVariants}
        initial="initial"
        animate="animate"
      >
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No groups yet</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">Get started by creating a new group to share expenses.</p>
        <Button onClick={handleCreateGroup}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Group
        </Button>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Group Expenses</h1>
          <p className="text-muted-foreground">Create and manage expenses for your groups.</p>
        </div>
        <motion.div variants={buttonMotionVariants} initial="initial" animate="animate">
          <Button onClick={handleCreateGroup} disabled={isLoading}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Group
          </Button>
        </motion.div>
      </div>

      {renderContent()}

      <GroupExpenseFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        group={editingGroup}
        onSave={handleSaveGroup}
        isSubmitting={isSubmitting}
      />

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this group and all its expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGroupToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
