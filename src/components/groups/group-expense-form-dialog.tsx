
"use client";

import React, { useEffect } from 'react';
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
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// --- Form Validation Schema ---

const memberSchema = z.object({
  name: z.string().min(1, "Member name is required."),
  expense: z.number().min(0, "Expense cannot be negative."),
});

const groupExpenseSchema = z.object({
  groupName: z.string().min(1, "Group name is required."),
  members: z.array(memberSchema).min(1, "At least one member is required."),
});

type GroupExpenseFormData = z.infer<typeof groupExpenseSchema>;


// --- Component Interface ---

interface GroupExpenseFormDialogProps {
  group?: GroupExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: GroupExpenseSubmitData) => void;
  isSubmitting?: boolean;
}


// --- Component ---

export function GroupExpenseFormDialog({
  group,
  open,
  onOpenChange,
  onSave,
  isSubmitting = false,
}: GroupExpenseFormDialogProps) {
  const { user } = useAuthState();
  const { selectedCurrency } = useCurrency();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupExpenseFormData>({
    resolver: zodResolver(groupExpenseSchema),
    defaultValues: {
      groupName: '',
      members: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  // Effect to reset the form when the dialog opens or the editing target changes.
  useEffect(() => {
    if (open) {
      if (group) { // Edit Mode
        reset({
          groupName: group.groupName,
          members: group.members.map((name, index) => ({
            name: name,
            expense: group.expenses[index] || 0,
          })),
        });
      } else { // Create Mode
        reset({
          groupName: '',
          members: [
            { name: user?.name || 'Me', expense: 0 },
            { name: '', expense: 0 },
          ],
        });
      }
    }
  }, [group, open, reset, user]);


  /**
   * Processes the form data, calculates balances, and calls the onSave prop.
   */
  const processSubmit = (data: GroupExpenseFormData) => {
    if (!user?.email) return;

    // Calculate totals and balances safely here, only on submit.
    const expenses = data.members.map(m => m.expense);
    const totalExpense = expenses.reduce((sum, expense) => sum + expense, 0);
    const averageExpense = data.members.length > 0 ? totalExpense / data.members.length : 0;
    const balances = expenses.map(expense => expense - averageExpense);
    const memberNames = data.members.map(m => m.name);

    const finalData: GroupExpenseSubmitData = {
      groupName: data.groupName,
      email: user.email,
      members: memberNames,
      expenses,
      totalExpense,
      balance: balances,
    };
    
    onSave(finalData);
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
        
        <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="groupName">Group Name</Label>
            <Input 
              id="groupName" 
              {...register("groupName")}
              disabled={isSubmitting} 
              placeholder="e.g., Trip to Goa" 
            />
            {errors.groupName && <p className="text-sm text-destructive">{errors.groupName.message}</p>}
          </div>
          
          <Separator className="my-2" />

          <div className="space-y-2">
            <Label className="font-medium">Members and Amounts Paid ({selectedCurrency})</Label>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-start">
                    <div className="flex-grow">
                      <Input
                        placeholder={`Member ${index + 1} Name`}
                        {...register(`members.${index}.name`)}
                        disabled={isSubmitting}
                      />
                      {errors.members?.[index]?.name && <p className="text-xs text-destructive mt-1">{errors.members[index].name.message}</p>}
                    </div>
                    <div className="w-32">
                       <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount Paid"
                        {...register(`members.${index}.expense`, { valueAsNumber: true })}
                        disabled={isSubmitting}
                      />
                      {errors.members?.[index]?.expense && <p className="text-xs text-destructive mt-1">{errors.members[index].expense.message}</p>}
                    </div>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => remove(index)} 
                        disabled={isSubmitting || fields.length <= 1}
                        className="text-destructive hover:bg-destructive/10 mt-1"
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
              size="sm"
              onClick={() => append({ name: '', expense: 0 })}
              disabled={isSubmitting}
            >
              Add Member
            </Button>
          </div>
          
          <DialogFooter className="pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : (group ? "Update Group" : "Save Group")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
