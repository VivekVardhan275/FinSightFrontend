
"use client";

import React, { useEffect, useState } from 'react';
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
import { RotateCw, Users, Trash2 } from "lucide-react";
import { useAuthState } from '@/hooks/use-auth-state';
import { useCurrency } from '@/contexts/currency-context';
import type { GroupExpense, GroupExpenseSubmitData } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

interface GroupExpenseFormDialogProps {
  group?: GroupExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: GroupExpenseSubmitData) => void;
}

interface MemberFormState {
  name: string;
  expense: number | string; // Allow string for empty input
}

export function GroupExpenseFormDialog({
  group,
  open,
  onOpenChange,
  onSave,
}: GroupExpenseFormDialogProps) {
  const { user } = useAuthState();
  const { selectedCurrency } = useCurrency();

  // Form State
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<MemberFormState[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Effect to initialize or reset the form when the dialog opens
  useEffect(() => {
    if (open) {
      if (group) { // Edit mode
        setGroupName(group.groupName);
        setMembers(group.members.map((name, index) => ({
          name,
          expense: group.expenses[index]
        })));
      } else { // Create mode
        setGroupName('');
        setMembers([
          { name: user?.name || 'Me', expense: 0 },
          { name: '', expense: 0 },
        ]);
      }
    }
  }, [open, group, user]);

  const handleMemberChange = (index: number, field: 'name' | 'expense', value: string) => {
    const updatedMembers = [...members];
    if (field === 'expense') {
      updatedMembers[index][field] = value; // Keep as string for controlled input
    } else {
      updatedMembers[index][field] = value;
    }
    setMembers(updatedMembers);
  };

  const addMember = () => {
    setMembers([...members, { name: '', expense: 0 }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const processSubmit = () => {
    if (!user?.email || !groupName) {
      // Basic validation, can be enhanced with react-hook-form if needed
      return;
    }
    setIsSaving(true);

    const expenses = members.map(m => parseFloat(String(m.expense)) || 0);
    const totalExpense = expenses.reduce((sum, expense) => sum + expense, 0);
    const averageExpense = members.length > 0 ? totalExpense / members.length : 0;
    const balances = expenses.map(expense => expense - averageExpense);

    const payload: GroupExpenseSubmitData = {
      groupName,
      email: user.email,
      members: members.map(m => m.name),
      expenses: expenses,
      balance: balances,
      totalExpense,
    };
    
    // Simulate API call delay
    setTimeout(() => {
        onSave(payload);
        setIsSaving(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={!isSaving ? onOpenChange : undefined}>
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
              disabled={isSaving} 
              placeholder="e.g., Trip to Goa" 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Your Email (from session)</Label>
            <Input value={user?.email || 'No email found'} readOnly className="cursor-not-allowed bg-muted/50" />
          </div>
            
          <Separator className="my-2" />

          <div className="space-y-2">
            <Label className="font-medium">Members and Amounts Paid ({selectedCurrency})</Label>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {members.map((member, index) => (
                  <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <Input
                      placeholder={`Member ${index + 1} Name`}
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      disabled={isSaving}
                    />
                    <Input
                      type="number"
                      placeholder="Amount Paid"
                      value={member.expense}
                      onChange={(e) => handleMemberChange(index, 'expense', e.target.value)}
                      className="w-32"
                      disabled={isSaving}
                    />
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeMember(index)} 
                        disabled={isSaving || members.length <= 1}
                        className="text-destructive hover:bg-destructive/10"
                        aria-label="Remove member"
                    >
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button 
              type="button" 
              variant="outline" 
              onClick={addMember}
              disabled={isSaving}
            >
              Add Member
            </Button>
          </div>
        </div>
          
        <DialogFooter className="pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={processSubmit} disabled={isSaving || !groupName}>
            {isSaving && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    