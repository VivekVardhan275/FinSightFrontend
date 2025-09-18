
"use client";

import React, { useEffect, useCallback } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCw, Users, Trash2 } from "lucide-react";
import { useAuthState } from '@/hooks/use-auth-state';
import { useCurrency } from '@/contexts/currency-context';
import { formatCurrency } from '@/lib/utils';
import type { GroupExpense, GroupExpenseFormData } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface GroupExpenseFormDialogProps {
  group?: GroupExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<GroupExpense, 'id' | 'balance'>) => void;
  isSaving?: boolean;
}

const getGroupExpenseSchema = () => z.object({
  groupName: z.string().min(1, "Group name is required."),
  email: z.string().email(),
  totalExpense: z.number().min(0, "Total expense must be a positive number."),
  members: z.array(z.object({
    name: z.string().min(1, "Member name is required."),
    expense: z.number().min(0, "Expense cannot be negative."),
  })).min(1, "At least one member is required."),
});

const MAX_MEMBERS = 10;

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
  const groupExpenseSchema = getGroupExpenseSchema();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<GroupExpenseFormData>({
    resolver: zodResolver(groupExpenseSchema),
    defaultValues: {
      groupName: '',
      email: user?.email || '',
      totalExpense: 0,
      members: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "members",
  });

  useEffect(() => {
    if (open) {
      if (group) { // EDIT MODE
        const existingMembers = group.members.map((name, i) => ({
          name,
          expense: group.expenses[i]
        }));
        reset({
          groupName: group.groupName,
          email: group.email,
          totalExpense: group.totalExpense,
          members: existingMembers,
        });
      } else { // CREATE MODE
        reset({
          groupName: '',
          email: user?.email || '',
          totalExpense: 0,
          members: [
            { name: user?.name || 'Me', expense: 0 },
            { name: '', expense: 0 }
          ],
        });
      }
    }
  }, [group, open, reset, user]);

  const handleNumberOfPersonsChange = useCallback((value: string) => {
    const newCount = parseInt(value, 10);
    const currentCount = fields.length;
    if (newCount > currentCount) {
      const toAdd = newCount - currentCount;
      append(Array.from({ length: toAdd }, () => ({ name: '', expense: 0 })));
    } else if (newCount < currentCount) {
      const toRemove = currentCount - newCount;
      const indicesToRemove = Array.from({ length: toRemove }, (_, i) => currentCount - 1 - i);
      remove(indicesToRemove);
    }
  }, [fields.length, append, remove]);
  
  const processSubmit = (data: GroupExpenseFormData) => {
    const memberExpensesSum = data.members.reduce((sum, m) => sum + m.expense, 0);

    if (Math.abs(memberExpensesSum - data.totalExpense) > 0.01) {
      setError("totalExpense", {
        type: "manual",
        message: `Member expenses sum (${formatCurrency(memberExpensesSum, selectedCurrency)}) must equal Total Expense.`,
      });
      toast({
        title: "Validation Error",
        description: `Member expenses sum (${formatCurrency(memberExpensesSum, selectedCurrency)}) does not match the Total Expense (${formatCurrency(data.totalExpense, selectedCurrency)}). Please correct the amounts.`,
        variant: "destructive",
      });
      return;
    }

    const payload: Omit<GroupExpense, 'id' | 'balance'> = {
      groupName: data.groupName,
      email: data.email,
      members: data.members.map(m => m.name),
      expenses: data.members.map(m => m.expense),
      totalExpense: data.totalExpense,
    };
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={!isSaving ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Users />
            {group ? "Edit Group Expense" : "Create New Group Expense"}
          </DialogTitle>
          <DialogDescription>
            Enter the details for your shared group expense.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)}>
          <ScrollArea className="h-[60vh] pr-6">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input id="groupName" {...register("groupName")} disabled={isSaving} />
                {errors.groupName && <p className="text-sm text-destructive">{errors.groupName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input id="email" {...register("email")} readOnly className="cursor-not-allowed bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalExpense">Total Expense ({selectedCurrency})</Label>
                <Input
                    id="totalExpense"
                    type="number"
                    step="0.01"
                    {...register("totalExpense", { valueAsNumber: true })}
                    disabled={isSaving}
                />
                {errors.totalExpense && <p className="text-sm text-destructive">{errors.totalExpense.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfPersons">Number of Persons</Label>
                <Select
                    value={String(fields.length)}
                    onValueChange={handleNumberOfPersonsChange}
                    disabled={isSaving}
                >
                    <SelectTrigger>
                    <SelectValue placeholder="Select number of members" />
                    </SelectTrigger>
                    <SelectContent>
                    {Array.from({ length: MAX_MEMBERS }, (_, i) => i + 1).map(num => (
                        <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 pt-2">
                <Label>Members and Amount Paid ({selectedCurrency})</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                    <div className="space-y-1">
                       <Input
                        placeholder={`Member ${index + 1} Name`}
                        {...register(`members.${index}.name` as const)}
                        disabled={isSaving}
                      />
                      {errors.members?.[index]?.name && <p className="text-sm text-destructive">{errors.members[index]?.name?.message}</p>}
                    </div>
                     <div className="space-y-1">
                        <Input
                            type="number"
                            step="0.01"
                            placeholder={`Amount paid`}
                            {...register(`members.${index}.expense` as const, { valueAsNumber: true })}
                            disabled={isSaving}
                        />
                        {errors.members?.[index]?.expense && <p className="text-sm text-destructive">{errors.members[index]?.expense?.message}</p>}
                    </div>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => remove(index)} 
                        disabled={isSaving || fields.length <= 1}
                        className="mt-1 text-destructive hover:bg-destructive/10"
                        aria-label="Remove member"
                    >
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                  </div>
                ))}
                 {errors.members && typeof errors.members.message === 'string' && <p className="text-sm text-destructive">{errors.members.message}</p>}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-6">
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
