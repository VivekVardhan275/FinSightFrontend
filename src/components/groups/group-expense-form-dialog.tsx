
"use client";

import React, { useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { RotateCw, Users, Trash2, PlusCircle } from "lucide-react";
import { useAuthState } from '@/hooks/use-auth-state';
import { useCurrency } from '@/contexts/currency-context';
import type { GroupExpense, GroupExpenseSubmitData, GroupExpenseFormData } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

const groupExpenseFormSchema = z.object({
  groupName: z.string().min(1, "Group name is required."),
  members: z.array(z.object({
    name: z.string().min(1, "Member name is required."),
    expense: z.number().min(0, "Expense must be a positive number."),
  })).min(1, "At least one member is required."),
});


interface GroupExpenseFormDialogProps {
  group?: GroupExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: GroupExpenseSubmitData) => void;
  isSaving?: boolean;
}

export function GroupExpenseFormDialog({
  group,
  open,
  onOpenChange,
  onSave,
  isSaving = false,
}: GroupExpenseFormDialogProps) {
  const { user } = useAuthState();
  const { selectedCurrency } = useCurrency();
  const { toast } = useToast();
  const isFirstRender = useRef(true);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupExpenseFormData>({
    resolver: zodResolver(groupExpenseFormSchema),
    defaultValues: {
      groupName: '',
      members: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });
  
  // This effect now correctly and safely resets the form ONLY when it opens.
  useEffect(() => {
    // Skip the first render to avoid resetting on initial mount when `open` might be true.
    if (isFirstRender.current) {
        isFirstRender.current = false;
        // Still reset if it's open on first render (e.g. dev mode strict mode)
        if (!open) return;
    }

    if (open) {
      if (group) { // EDIT MODE
        const membersFromGroup = group.members.map((name, i) => ({
          name,
          expense: group.expenses[i]
        }));
        reset({
          groupName: group.groupName,
          members: membersFromGroup,
        });
      } else { // CREATE MODE
        reset({
          groupName: '',
          members: [
            { name: user?.name || 'Me', expense: 0 },
            { name: '', expense: 0 }
          ],
        });
      }
    }
  }, [open, group, user, reset]); // `reset` is stable, so this only runs when `open`, `group`, or `user` changes.


  const processSubmit = (data: GroupExpenseFormData) => {
    if (!user || !user.email) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }

    const totalExpense = data.members.reduce((sum, m) => sum + m.expense, 0);
    const memberCount = data.members.length;
    const averageExpense = memberCount > 0 ? totalExpense / memberCount : 0;
    
    const payload: GroupExpenseSubmitData = {
      groupName: data.groupName,
      email: user.email,
      members: data.members.map(m => m.name),
      expenses: data.members.map(m => m.expense),
      totalExpense: totalExpense,
      balance: data.members.map(m => m.expense - averageExpense),
    };
    
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={!isSaving ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Users />
            {group ? "Edit Group Expense" : "Create New Group"}
          </DialogTitle>
          <DialogDescription>
            Enter a name for your group and add the members who are sharing the expenses.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input id="groupName" {...register("groupName")} disabled={isSaving} placeholder="e.g., Trip to Goa" />
              {errors.groupName && <p className="text-sm text-destructive">{errors.groupName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Your Email (from session)</Label>
              <Input value={user?.email || 'No email found'} readOnly className="cursor-not-allowed bg-muted/50" />
            </div>
            
            <Separator className="my-2" />

            <div className="space-y-4">
              <Label className="font-medium">Members and Amounts Paid ({selectedCurrency})</Label>
              <ScrollArea className="h-[25vh] pr-4">
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start p-2 border rounded-md">
                      <div className="space-y-1">
                        <Label htmlFor={`members.${index}.name`} className="text-xs text-muted-foreground">Member Name</Label>
                        <Input
                          id={`members.${index}.name`}
                          placeholder={`Member ${index + 1}`}
                          {...register(`members.${index}.name` as const)}
                          disabled={isSaving}
                        />
                        {errors.members?.[index]?.name && <p className="text-xs text-destructive">{errors.members[index]?.name?.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`members.${index}.expense`} className="text-xs text-muted-foreground">Amount Paid</Label>
                        <Input
                          id={`members.${index}.expense`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register(`members.${index}.expense` as const, { valueAsNumber: true })}
                          disabled={isSaving}
                        />
                        {errors.members?.[index]?.expense && <p className="text-xs text-destructive">{errors.members[index]?.expense?.message}</p>}
                      </div>
                      <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => remove(index)} 
                          disabled={isSaving || fields.length <= 1}
                          className="mt-5 text-destructive hover:bg-destructive/10"
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
                onClick={() => append({ name: '', expense: 0 })}
                disabled={isSaving}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Another Member
              </Button>
              {errors.members && typeof errors.members.message === 'string' && <p className="text-sm text-destructive">{errors.members.message}</p>}
            </div>
          </div>
          <DialogFooter className="pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
