// src/components/groups/group-expense-form-dialog.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, PlusCircle, RotateCw } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Group, GroupExpenseFormData } from '@/types';
import { useAuthState } from "@/hooks/use-auth-state";
import { Separator } from "../ui/separator";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/currency-context";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

export type SplitMethod = "equal" | "unequal";

const memberSchema = z.object({
  name: z.string().min(1, "Name is required."),
  expense: z.number().min(0, "Expense must be non-negative."),
  balance: z.number(),
});

const groupExpenseSchema = z.object({
  groupName: z.string().min(1, "Group name is required."),
  totalExpense: z.number().min(0, "Total expense must be non-negative."),
  splitMethod: z.enum(["equal", "unequal"]),
  members: z.array(memberSchema).min(1, "At least one group member is required."),
}).refine(data => {
    if (data.splitMethod === 'unequal') {
        const sumOfMemberExpenses = data.members.reduce((sum, member) => sum + member.expense, 0);
        // Use a small epsilon for floating point comparison
        return Math.abs(sumOfMemberExpenses - data.totalExpense) < 0.01;
    }
    return true;
}, {
    message: "The sum of individual expenses must equal the total expense.",
    path: ["members"],
});


interface GroupExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: GroupExpenseFormData) => void;
  group?: Group | null;
  isSaving?: boolean;
}

export function GroupExpenseFormDialog({
  open,
  onOpenChange,
  onSave,
  group,
  isSaving = false,
}: GroupExpenseFormDialogProps) {
  const { user } = useAuthState();
  const { selectedCurrency } = useCurrency();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<GroupExpenseFormData>({
    resolver: zodResolver(groupExpenseSchema),
    defaultValues: {
      groupName: "",
      totalExpense: 0,
      splitMethod: "equal",
      members: [{ name: user?.name || "", expense: 0, balance: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const { totalExpense, members, splitMethod } = watch();

  const sumOfIndividualExpenses = useMemo(() => {
    return members.reduce((sum, member) => sum + (member.expense || 0), 0);
  }, [members]);

  const expenseMismatch = Math.abs(sumOfIndividualExpenses - totalExpense) > 0.01;

  const handleSplitMethodChange = (value: SplitMethod) => {
    setValue('splitMethod', value);
    if (value === 'equal') {
      const currentTotalExpense = getValues('totalExpense');
      const currentMembers = getValues('members');
      const memberCount = currentMembers.length;
      const amountPerMember = memberCount > 0 ? currentTotalExpense / memberCount : 0;
      currentMembers.forEach((_, index) => {
        setValue(`members.${index}.expense`, parseFloat(amountPerMember.toFixed(2)));
      });
    }
  };

  useEffect(() => {
    if (open) {
      if (group) {
        // Editing existing group
        reset({
          groupName: group.groupName,
          totalExpense: group.totalExpenses,
          splitMethod: "unequal",
          members: group.members.map((name, index) => ({
            name,
            expense: group.expenses[index] || 0,
            balance: group.balances[index] || 0,
          })),
        });
      } else {
        // Creating new group
        reset({
          groupName: "",
          totalExpense: 0,
          splitMethod: "equal",
          members: [{ name: user?.name || "Me", expense: 0, balance: 0 }],
        });
      }
    }
  }, [open, group, reset, user]);

  const processSubmit = (data: GroupExpenseFormData) => {
    // Re-calculate equal split on submit to ensure data is fresh
    if (data.splitMethod === 'equal') {
        const memberCount = data.members.length;
        const amountPerMember = memberCount > 0 ? data.totalExpense / memberCount : 0;
        data.members.forEach((member) => {
            member.expense = parseFloat(amountPerMember.toFixed(2));
        });
    }

    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={!isSaving ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">{group ? "Edit Group Expense" : "Create Group Expense"}</DialogTitle>
          <DialogDescription>
            {group ? "Update the details for this shared expense." : "Add members and their expenses to create a new group."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input id="groupName" {...register("groupName")} disabled={isSaving} />
              {errors.groupName && <p className="text-sm text-destructive">{errors.groupName.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="totalExpense">Total Expense ({selectedCurrency})</Label>
              <Input id="totalExpense" type="number" step="0.01" {...register("totalExpense", { valueAsNumber: true })} disabled={isSaving} />
              {errors.totalExpense && <p className="text-sm text-destructive">{errors.totalExpense.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Split Method</Label>
             <RadioGroup
                onValueChange={(value) => handleSplitMethodChange(value as SplitMethod)}
                value={splitMethod}
                className="flex space-x-4 pt-1"
                disabled={isSaving}
              >
                <div>
                  <RadioGroupItem value="equal" id="split-equal" />
                  <Label htmlFor="split-equal" className="ml-2 cursor-pointer">Split Equally</Label>
                </div>
                <div>
                  <RadioGroupItem value="unequal" id="split-unequal" />
                  <Label htmlFor="split-unequal" className="ml-2 cursor-pointer">Split Unequally</Label>
                </div>
              </RadioGroup>
          </div>

          <Separator />

          <div>
             <Label>Group Members</Label>
             <p className="text-xs text-muted-foreground mb-2">Add members and their respective expenses and balances.</p>
          </div>

          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4 space-y-1">
                    <Input
                      placeholder="Member Name"
                      {...register(`members.${index}.name`)}
                      disabled={isSaving}
                    />
                    {errors.members?.[index]?.name && <p className="text-xs text-destructive">{errors.members[index]?.name?.message}</p>}
                  </div>
                  <div className="col-span-4 space-y-1">
                     <Input
                        type="number"
                        step="0.01"
                        placeholder="Expense"
                        {...register(`members.${index}.expense`, { valueAsNumber: true })}
                        disabled={isSaving || splitMethod === 'equal'}
                        className={splitMethod === 'equal' ? 'bg-muted/70' : ''}
                      />
                      {errors.members?.[index]?.expense && <p className="text-xs text-destructive">{errors.members[index]?.expense?.message}</p>}
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Balance"
                      {...register(`members.${index}.balance`, { valueAsNumber: true })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end items-center h-10">
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isSaving}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
           {errors.members?.root && <p className="text-sm text-destructive mt-2">{errors.members.root.message}</p>}
           {(splitMethod === 'unequal' && expenseMismatch && !errors.members?.root) && (
              <p className="text-sm text-destructive mt-2">
                Sum of expenses ({formatCurrency(sumOfIndividualExpenses, selectedCurrency)}) does not match total expense ({formatCurrency(totalExpense, selectedCurrency)}).
              </p>
           )}

          <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", expense: 0, balance: 0 })} disabled={isSaving}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Member
          </Button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : group ? "Update Group" : "Save Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
