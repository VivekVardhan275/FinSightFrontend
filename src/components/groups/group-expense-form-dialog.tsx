
// src/components/groups/group-expense-form-dialog.tsx
"use client";

import React, { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, PlusCircle, RotateCw } from "lucide-react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Group, GroupExpenseFormData } from '@/types';
import { useAuthState } from "@/hooks/use-auth-state";
import { Separator } from "../ui/separator";
import { useCurrency } from "@/contexts/currency-context";

const memberSchema = z.object({
  name: z.string().min(1, "Name is required."),
  expense: z.number().min(0, "Expense must be non-negative."),
  balance: z.number(), // Balance is not directly validated in the form, but calculated on save
});

const groupExpenseSchema = z.object({
  groupName: z.string().min(1, "Group name is required."),
  totalExpense: z.number().min(0, "Total expense must be non-negative."),
  members: z.array(memberSchema).min(1, "At least one group member is required."),
}).refine(data => {
    // This validation runs on submit
    if (data.members.length === 0) return true; // Let min(1) handle this
    const sumOfMemberExpenses = data.members.reduce((sum, member) => sum + member.expense, 0);
    // Use a small tolerance for floating point comparisons
    return Math.abs(sumOfMemberExpenses - data.totalExpense) < 0.01;
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
    formState: { errors },
  } = useForm<GroupExpenseFormData>({
    resolver: zodResolver(groupExpenseSchema),
    defaultValues: {
      groupName: "",
      totalExpense: 0,
      members: [{ name: user?.name || "", expense: 0, balance: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const watchedMembers = useWatch({ control, name: "members" });
  const watchedTotalExpense = useWatch({ control, name: "totalExpense" });
  const sumOfIndividualExpenses = React.useMemo(() => {
    return watchedMembers.reduce((sum, member) => sum + (member.expense || 0), 0);
  }, [watchedMembers]);
  
  const isSumMismatch = Math.abs(sumOfIndividualExpenses - watchedTotalExpense) > 0.01;


  useEffect(() => {
    if (open) {
      if (group) {
        reset({
          groupName: group.groupName,
          totalExpense: group.totalExpenses,
          members: group.members.map((name, index) => ({
            name,
            expense: group.expenses[index] || 0,
            balance: group.balances[index] || 0,
          })),
        });
      } else {
        reset({
          groupName: "",
          totalExpense: 0,
          members: [{ name: user?.name || "Me", expense: 0, balance: 0 }],
        });
      }
    }
  }, [open, group, reset, user]);

  const processSubmit = useCallback((data: GroupExpenseFormData) => {
    onSave(data);
  }, [onSave]);

  return (
    <Dialog open={open} onOpenChange={!isSaving ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">{group ? "Edit Group Expense" : "Create Group Expense"}</DialogTitle>
          <DialogDescription>
            {group ? "Update the details for this shared expense." : "Enter the total expense, then add members and their individual amounts."}
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
              <Input
                id="totalExpense"
                type="number"
                step="0.01"
                {...register("totalExpense", { valueAsNumber: true })}
                disabled={isSaving}
              />
              {errors.totalExpense && <p className="text-sm text-destructive">{errors.totalExpense.message}</p>}
            </div>
          </div>

          <Separator />

          <div>
             <Label>Group Members</Label>
             <p className="text-xs text-muted-foreground mb-2">Add members and enter the amount each person contributed.</p>
          </div>

          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-6 space-y-1">
                    <Input
                      placeholder="Member Name"
                      {...register(`members.${index}.name`)}
                      disabled={isSaving}
                    />
                    {errors.members?.[index]?.name && <p className="text-xs text-destructive">{errors.members[index]?.name?.message}</p>}
                  </div>
                  <div className="col-span-5 space-y-1">
                     <Input
                        type="number"
                        step="0.01"
                        placeholder="Expense"
                        {...register(`members.${index}.expense`, { valueAsNumber: true })}
                        disabled={isSaving}
                      />
                      {errors.members?.[index]?.expense && <p className="text-xs text-destructive">{errors.members[index]?.expense?.message}</p>}
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
           {isSumMismatch && <p className="text-sm text-destructive mt-2">The sum of individual expenses ({sumOfIndividualExpenses.toFixed(2)}) does not match the total expense ({watchedTotalExpense.toFixed(2)}).</p>}
           {errors.members?.root && <p className="text-sm text-destructive mt-2">{errors.members.root.message}</p>}
           {errors.members && !errors.members.root && typeof errors.members.message === 'string' && <p className="text-sm text-destructive mt-2">{errors.members.message}</p>}
          
          <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", expense: 0, balance: 0 })}
              disabled={isSaving}
            >
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
