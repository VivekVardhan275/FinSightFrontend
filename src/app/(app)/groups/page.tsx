
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import type { GroupExpense } from '@/types';
import { GroupCard } from '@/components/groups/group-card';
import { GroupExpenseFormDialog } from '@/components/groups/group-expense-form-dialog';
import { useNotification } from '@/contexts/notification-context';
import { v4 as uuidv4 } from 'uuid';
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

// MOCK DATA for initial UI display. This will be replaced by context/API calls.
const MOCK_GROUPS: GroupExpense[] = [
    {
        id: 'group-1',
        groupName: 'Trip to Goa',
        email: 'user@example.com',
        members: ['Alice', 'Bob', 'Charlie'],
        expenses: [2000.0, 1000.0, 0.0],
        balance: [1000.0, 0.0, -1000.0],
        totalExpense: 3000.0,
    },
    {
        id: 'group-2',
        groupName: 'Dinner Party',
        email: 'user@example.com',
        members: ['David', 'Eve'],
        expenses: [500.0, 1500.0],
        balance: [-500.0, 500.0],
        totalExpense: 2000.0,
    },
];

const buttonMotionVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.2 } },
};

const gridContainerMotionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.3,
      duration: 0.5,
    },
  },
};

const groupCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.07,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

const emptyStateMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupExpense[]>(MOCK_GROUPS);
  const [isLoading, setIsLoading] = useState(false); // Will be driven by context later
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupExpense | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);
  const { addNotification } = useNotification();

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
  
  const handleDeleteGroup = () => {
    if (!groupToDeleteId) return;

    // MOCK: Filter out the group to delete
    setGroups(prev => prev.filter(g => g.id !== groupToDeleteId));
    addNotification({
        title: "Group Deleted (Mock)",
        description: `Group has been removed from the list.`,
        type: 'info'
    });
    setIsConfirmDeleteDialogOpen(false);
    setGroupToDeleteId(null);
  };

  const handleSaveGroup = (data: Omit<GroupExpense, 'id'>) => {
    if (editingGroup) {
        // MOCK: Update existing group
        const updatedGroup = { ...data, id: editingGroup.id };
        setGroups(prev => prev.map(g => g.id === editingGroup.id ? updatedGroup : g));
        addNotification({
            title: "Group Updated (Mock)",
            description: `Data for "${data.groupName}" has been updated.`,
            type: 'success'
        });
    } else {
        // MOCK: Add new group with a unique ID
        const newGroup = { ...data, id: uuidv4() };
        setGroups(prev => [...prev, newGroup]);
        addNotification({
            title: "Group Created (Mock)",
            description: `A new group "${data.groupName}" has been created.`,
            type: 'success'
        });
    }
    
    setIsFormOpen(false);
    setEditingGroup(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Group Expenses
          </h1>
          <p className="text-muted-foreground">
            Create and manage expenses for your groups.
          </p>
        </div>
        <motion.div initial="initial" animate="animate" variants={buttonMotionVariants} viewport={{ once: true }}>
          <Button onClick={handleCreateGroup} disabled={isLoading}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Group
          </Button>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-10">
          <RotateCw className="mr-2 h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      ) : groups.length > 0 ? (
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={gridContainerMotionVariants}
          viewport={{ once: true }}
        >
          {groups.map((group, index) => (
            <GroupCard
              key={group.id}
              group={group}
              onEdit={handleEditGroup}
              onDelete={confirmDeleteGroup}
              variants={groupCardVariants}
              custom={index}
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
            Get started by creating a new group to share expenses.
          </p>
          <Button onClick={handleCreateGroup}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Group
          </Button>
        </motion.div>
      )}

      <GroupExpenseFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        group={editingGroup}
        onSave={handleSaveGroup}
      />

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this group expense.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGroupToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteGroup}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
