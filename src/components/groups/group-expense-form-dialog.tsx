
"use client";

import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
  onSave: (data: Omit<GroupExpense, 'id'>) => void;
  isSaving?: boolean;
}

const getGroupExpenseSchema = () => z.object({
  groupName: z.string().min(1, "Group name is required."),
  email: z.string().email(),
  numberOfPersons: z.number().min(1, "At least one person is required."),
  members: z.array(z.object({
    name: z.string().min(1, "Member name is required."),
    expense: z.number().min(0, "Expense cannot be negative."),
  })).min(1),
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
  const { selectedCurrency, conversionRates } = useCurrency();
  const { toast } = useToast();
  const groupExpenseSchema = getGroupExpenseSchema();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<GroupExpenseFormData>({
    resolver: zodResolver(groupExpenseSchema),
    defaultValues: {
      groupName: '',
      email: user?.email || '',
      numberOfPersons: 2,
      members: [{ name: '', expense: 0 }, { name: '', expense: 0 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "members",
  });

  const numberOfPersons = watch('numberOfPersons');
  const members = watch('members');

  useEffect(() => {
    if (user?.email) {
      reset({
        groupName: group?.groupName || '',
        email: user.email,
        numberOfPersons: group?.members.length || 2,
        members: group
          ? group.members.map((name, i) => ({ name, expense: group.expenses[i] }))
          : [{ name: user.name || 'Me', expense: 0 }, { name: '', expense: 0 }],
      });
    }
  }, [group, user, open, reset]);

  useEffect(() => {
    const currentCount = fields.length;
    if (numberOfPersons > currentCount) {
      for (let i = 0; i < numberOfPersons - currentCount; i++) {
        append({ name: '', expense: 0 });
      }
    } else if (numberOfPersons < currentCount) {
      for (let i = 0; i < currentCount - numberOfPersons; i++) {
        remove(currentCount - 1 - i);
      }
    }
  }, [numberOfPersons, fields.length, append, remove]);

  const totalExpense = useMemo(() => {
    return members.reduce((sum, member) => sum + (member.expense || 0), 0);
  }, [members]);

  const processSubmit = (data: GroupExpenseFormData) => {
    const totalExpenseValue = data.members.reduce((sum, m) => sum + m.expense, 0);
    const averageExpense = totalExpenseValue / data.numberOfPersons;

    const balances = data.members.map(m => m.expense - averageExpense);
    
    // Convert amounts to INR for API
    const amountInINR = (amount: number) => amount / (conversionRates[selectedCurrency] || 1);

    const payload: Omit<GroupExpense, 'id'> = {
      groupName: data.groupName,
      email: data.email,
      members: data.members.map(m => m.name),
      expenses: data.members.map(m => amountInINR(m.expense)),
      balance: balances.map(b => amountInINR(b)),
      totalExpense: amountInINR(totalExpenseValue),
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
                <Label htmlFor="numberOfPersons">Number of Persons</Label>
                <Controller
                  name="numberOfPersons"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={String(field.value)} disabled={isSaving}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of members" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: MAX_MEMBERS }, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-4 pt-2">
                <Label>Members and Expenses ({selectedCurrency})</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-2 gap-2 items-start">
                    <div className="space-y-1">
                       <Input
                        placeholder={`Member ${index + 1} Name`}
                        {...register(`members.${index}.name` as const)}
                        disabled={isSaving}
                      />
                      {errors.members?.[index]?.name && <p className="text-sm text-destructive">{errors.members?.[index]?.name?.message}</p>}
                    </div>
                     <div className="space-y-1">
                        <Input
                            type="number"
                            step="0.01"
                            placeholder={`Expense for ${watch(`members.${index}.name`) || `Member ${index + 1}`}`}
                            {...register(`members.${index}.expense` as const, { valueAsNumber: true })}
                            disabled={isSaving}
                        />
                        {errors.members?.[index]?.expense && <p className="text-sm text-destructive">{errors.members?.[index]?.expense?.message}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 text-right">
                <p className="text-lg font-bold">
                    Total Expense: {formatCurrency(totalExpense, selectedCurrency)}
                </p>
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
