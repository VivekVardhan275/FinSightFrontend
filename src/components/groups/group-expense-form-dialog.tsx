"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// UI Components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


// Icons
import { RotateCw, Users, Trash2, PlusCircle } from "lucide-react";

// Hooks, Types, & Utilities
import { useAuthState } from '@/hooks/use-auth-state';
import { useCurrency } from '@/contexts/currency-context';
import type { GroupExpense, GroupExpenseSubmitData } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useNotification } from '@/contexts/notification-context';


/**
 * Props for the GroupExpenseFormDialog component.
 */
interface GroupExpenseFormDialogProps {
  /** The group object to edit. If null or undefined, the form is in 'create' mode. */
  group?: GroupExpense | null;
  /** Controls whether the dialog is open. */
  open: boolean;
  /** Callback function to change the open state. */
  onOpenChange: (open: boolean) => void;
  /** Callback function triggered on successful save. */
  onSave: (data: GroupExpenseSubmitData) => void;
  /** Flag indicating if the parent component is currently submitting data. */
  isSubmitting: boolean;
}

interface MemberFormState {
  name: string;
  expense: number | string; // Allow string for empty input field
}

/**
 * A dialog component for creating or editing a group expense.
 * It handles form state, member management, and submission payload creation.
 */
export function GroupExpenseFormDialog({
  group,
  open,
  onOpenChange,
  onSave,
  isSubmitting,
}: GroupExpenseFormDialogProps) {
  const { user } = useAuthState();
  const { selectedCurrency } = useCurrency();
  const { addNotification } = useNotification();

  // Form State
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<MemberFormState[]>([]);

  // Effect to initialize or reset the form state ONLY when the dialog opens.
  useEffect(() => {
    if (open) {
      if (group) { // Edit mode: Populate form with existing group data.
        setGroupName(group.groupName);
        setMembers(group.members.map((name, index) => ({
          name,
          expense: group.expenses[index]
        })));
      } else { // Create mode: Reset to a default state.
        setGroupName('');
        setMembers([
          { name: user?.name || 'Me', expense: '' },
          { name: '', expense: '' },
        ]);
      }
    }
  }, [open, group, user]);

  /**
   * Calculate total expense in real-time for display.
   * useMemo ensures this only recalculates when member expenses change.
   */
  const totalExpense = useMemo(() => {
    return members.reduce((sum, member) => sum + (parseFloat(String(member.expense)) || 0), 0);
  }, [members]);

  const handleMemberChange = (index: number, field: 'name' | 'expense', value: string) => {
    const updatedMembers = members.map((member, i) =>
      i === index ? { ...member, [field]: value } : member
    );
    setMembers(updatedMembers);
  };

  const addMember = () => {
    setMembers([...members, { name: '', expense: '' }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) { // Ensure at least one member remains
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    // --- Validation ---
    if (!user?.email) {
      addNotification({ title: "Error", description: "User email not found. Please log in again.", type: 'error' });
      return;
    }
    if (!groupName.trim()) {
      addNotification({ title: "Validation Error", description: "Group name cannot be empty.", type: 'error' });
      return;
    }
    const hasEmptyName = members.some(m => !m.name.trim());
    if (hasEmptyName) {
        addNotification({ title: "Validation Error", description: "All member names must be filled out.", type: 'error' });
        return;
    }

    // --- Payload Creation ---
    const expenses = members.map(m => parseFloat(String(m.expense)) || 0);
    const finalTotalExpense = expenses.reduce((sum, expense) => sum + expense, 0);
    const averageExpense = members.length > 0 ? finalTotalExpense / members.length : 0;
    const balances = expenses.map(expense => expense - averageExpense);

    const payload: GroupExpenseSubmitData = {
      groupName: groupName.trim(),
      email: user.email,
      members: members.map(m => m.name.trim()),
      expenses,
      balance: balances,
      totalExpense: finalTotalExpense,
    };
    
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={!isSubmitting ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Users />
            {group ? "Edit Group Expense" : "Create New Group"}
          </DialogTitle>
          <DialogDescription>
            Enter a name for your group and add members with the amounts they paid.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., Trip to Goa"
            />
          </div>
          
          <Separator className="my-2" />

          <div className="space-y-2">
            <Label className="font-medium">Members & Amounts Paid ({selectedCurrency})</Label>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {members.map((member, index) => (
                    <motion.div
                      key={index}
                      className="grid grid-cols-[1fr_auto_auto] gap-2 items-center"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        placeholder={`Member ${index + 1} Name`}
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                        disabled={isSubmitting}
                      />
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={member.expense}
                        onChange={(e) => handleMemberChange(index, 'expense', e.target.value)}
                        className="w-32"
                        disabled={isSubmitting}
                      />
                       <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMember(index)}
                              disabled={isSubmitting || members.length <= 1}
                              className="text-destructive hover:bg-destructive/10"
                              aria-label="Remove member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove Member</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
            <Button
              type="button"
              variant="outline"
              onClick={addMember}
              disabled={isSubmitting}
              className="mt-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        </div>
        
        <DialogFooter className="pt-6 border-t sm:justify-between items-center">
            <div className="text-lg font-bold text-foreground">
                Total: {formatCurrency(totalExpense, selectedCurrency)}
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || !groupName.trim()}>
                    {isSubmitting && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Saving..." : (group ? "Update Group" : "Save Group")}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
