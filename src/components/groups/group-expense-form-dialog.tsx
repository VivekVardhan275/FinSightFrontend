
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

interface GroupExpenseFormDialogProps {
  group?: GroupExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: GroupExpenseSubmitData) => void;
  isSubmitting: boolean;
}

interface MemberFormState {
  id: string; // Use a unique ID for stable keys
  name: string;
  expense: string; // Always store as string to avoid controlled/uncontrolled input warnings
}

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

  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<MemberFormState[]>([]);

  useEffect(() => {
    // This effect runs ONLY when the dialog's `open` prop changes from false to true.
    // It safely initializes the form state for either creating or editing.
    if (open) {
      if (group) { // Edit mode
        setGroupName(group.groupName);
        setMembers(group.members.map((name, index) => ({
          id: `existing-${index}-${group.id}`,
          name,
          expense: String(group.expenses?.[index] ?? '')
        })));
      } else { // Create mode
        setGroupName('');
        setMembers([
          { id: `new-${Date.now()}`, name: user?.name || 'Me', expense: '' },
          { id: `new-${Date.now() + 1}`, name: '', expense: '' },
        ]);
      }
    }
  }, [open, group, user]);

  const totalExpense = useMemo(() => {
    return members.reduce((sum, member) => sum + (parseFloat(member.expense) || 0), 0);
  }, [members]);

  const handleMemberChange = (id: string, field: 'name' | 'expense', value: string) => {
    setMembers(currentMembers =>
      currentMembers.map(member =>
        member.id === id ? { ...member, [field]: value } : member
      )
    );
  };

  const addMember = () => {
    setMembers([...members, { id: `new-${Date.now()}`, name: '', expense: '' }]);
  };

  const removeMember = (id: string) => {
    if (members.length > 1) {
      setMembers(members.filter(member => member.id !== id));
    }
  };

  const handleSubmit = () => {
    if (!user?.email) {
      addNotification({ title: "Authentication Error", description: "User email not found. Please log in again.", type: 'error' });
      return;
    }
    if (!groupName.trim()) {
      addNotification({ title: "Validation Error", description: "Group name is required.", type: 'error' });
      return;
    }
    if (members.some(m => !m.name.trim())) {
        addNotification({ title: "Validation Error", description: "All member names must be filled out.", type: 'error' });
        return;
    }
    if (members.some(m => m.expense.trim() === '' || isNaN(Number(m.expense)))) {
        addNotification({ title: "Validation Error", description: "All expense fields must contain a valid number.", type: 'error' });
        return;
    }

    const expenses = members.map(m => parseFloat(m.expense) || 0);
    const finalTotalExpense = expenses.reduce((sum, expense) => sum + expense, 0);

    const payload: GroupExpenseSubmitData = {
      groupName: groupName.trim(),
      email: user.email,
      members: members.map(m => m.name.trim()),
      expenses,
      totalExpense: finalTotalExpense,
    };
    
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Users />
            {group ? "Edit Group Expense" : "Create New Group"}
          </DialogTitle>
          <DialogDescription>
            Enter a name for your group and add the amount each member paid.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., Weekend Trip"
            />
          </div>
          
          <Separator className="my-2" />

          <div className="space-y-2">
            <Label className="font-medium">Members & Amounts Paid ({selectedCurrency})</Label>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {members.map((member) => (
                    <motion.div
                      key={member.id}
                      className="grid grid-cols-[1fr_auto_auto] gap-2 items-center"
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        placeholder={`Member Name`}
                        value={member.name}
                        onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                        disabled={isSubmitting}
                      />
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={member.expense}
                        onChange={(e) => handleMemberChange(member.id, 'expense', e.target.value)}
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
                              onClick={() => removeMember(member.id)}
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
                <Button onClick={handleSubmit} disabled={isSubmitting || !groupName.trim() || members.length === 0}>
                    {isSubmitting && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Saving..." : (group ? "Update Group" : "Save Group")}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
