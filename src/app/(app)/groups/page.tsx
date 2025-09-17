// src/app/(app)/groups/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import type { Group } from '@/types';
import { GroupExpenseFormDialog, type GroupExpenseFormData } from '@/components/groups/group-expense-form-dialog';
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

// Mock data - replace with API call in a real scenario
const mockGroups: Group[] = [
  { id: '1', groupName: 'Trip to Mountains', email: 'review-user@example.com', members: ['Alice', 'Bob'], expenses: [100, 50], balance: [25, -25], totalExpense: 150 },
  { id: '2', groupName: 'Apartment Utilities', email: 'review-user@example.com', members: ['Charlie', 'Dana', 'Eve'], expenses: [90, 0, 0], balance: [60, -30, -30], totalExpense: 90 },
];

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
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);
  
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

  const confirmDeleteGroup = (groupId: string) => {
    setGroupToDeleteId(groupId);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDeleteId) return;
    setIsDeleting(true);

    // MOCK API CALL
    await new Promise(resolve => setTimeout(resolve, 1000));
    setGroups(prev => prev.filter(g => g.id !== groupToDeleteId));
    
    toast({
        title: "Group Deleted",
        description: "The group expense has been successfully deleted.",
    });

    setIsDeleting(false);
    setIsConfirmDeleteDialogOpen(false);
    setGroupToDeleteId(null);
  };

  const handleSaveGroup = async (formData: GroupExpenseFormData) => {
    setIsSaving(true);
    // MOCK API CALL
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (editingGroup) {
      // Update logic
      const updatedGroup: Group = {
        ...editingGroup,
        groupName: formData.groupName,
        members: formData.members.map(m => m.name),
        expenses: formData.members.map(m => m.expense),
        balance: formData.members.map(m => m.balance),
        totalExpense: formData.totalExpense,
      };
      setGroups(prev => prev.map(g => g.id === editingGroup.id ? updatedGroup : g));
      toast({
        title: "Group Updated",
        description: `Group "${formData.groupName}" has been successfully updated.`,
      });
    } else {
      // Create logic
      const newGroup: Group = {
        id: (Math.random() * 1000).toString(), // Mock ID
        groupName: formData.groupName,
        email: user?.email || "",
        members: formData.members.map(m => m.name),
        expenses: formData.members.map(m => m.expense),
        balance: formData.members.map(m => m.balance),
        totalExpense: formData.totalExpense,
      };
      setGroups(prev => [...prev, newGroup]);
      toast({
        title: "Group Created",
        description: `Group "${formData.groupName}" has been successfully created.`,
      });
    }

    setIsSaving(false);
    setIsFormOpen(false);
    setEditingGroup(null);
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
      
      {groups.length > 0 ? (
        <motion.div
            variants={gridContainerMotionVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
            {groups.map((group) => (
                <GroupCard
                    key={group.id}
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
