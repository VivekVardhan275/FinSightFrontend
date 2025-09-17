// src/components/groups/group-expense-form-dialog.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, PlusCircle, RotateCw } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Group } from '@/types';
import { useAuthState } from "@/hooks/use-auth-state";
import { Separator } from "../ui/separator";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/currency-context";

export interface GroupExpenseFormData {
  groupName: string;
  members: Array<{
    name: string;
    expense: number;
    balance: number;
  }>;
  totalExpense: number;
}

const memberSchema = z.object({
  name: z.string().min(1, "Name is required."),
  expense: z.number().min(0, "Expense must be non-negative."),
  balance: z.number(),
});

const groupExpenseSchema = z.object({
  groupName: z.string().min(1, "Group name is required."),
  members: z.array(memberSchema).min(1, "At least one group member is required."),
  totalExpense: z.number(),
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
    formState: { errors },
  } = useForm<GroupExpenseFormData>({
    resolver: zodResolver(groupExpenseSchema),
    defaultValues: {
      groupName: "",
      members: [{ name: user?.name || "", expense: 0, balance: 0 }],
      totalExpense: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const members = watch("members");

  const totalExpense = useMemo(() => {
    return members.reduce((sum, member) => sum + (member.expense || 0), 0);
  }, [members]);

  useEffect(() => {
    setValue("totalExpense", totalExpense);
  }, [totalExpense, setValue]);


  useEffect(() => {
    if (open) {
      if (group) {
        // Editing existing group
        reset({
          groupName: group.groupName,
          members: group.members.map((name, index) => ({
            name,
            expense: group.expenses[index] || 0,
            balance: group.balance[index] || 0,
          })),
          totalExpense: group.totalExpense,
        });
      } else {
        // Creating new group
        reset({
          groupName: "",
          members: [{ name: user?.name || "Me", expense: 0, balance: 0 }],
          totalExpense: 0,
        });
      }
    }
  }, [open, group, reset, user]);

  const processSubmit = (data: GroupExpenseFormData) => {
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
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input id="groupName" {...register("groupName")} disabled={isSaving} />
            {errors.groupName && <p className="text-sm text-destructive">{errors.groupName.message}</p>}
          </div>

          <Separator />
          
          <div>
             <Label>Group Members</Label>
             <p className="text-xs text-muted-foreground mb-2">Add members and their respective expenses and balances.</p>
          </div>
          
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    placeholder="Member Name"
                    {...register(`members.${index}.name`)}
                    className="col-span-4"
                    disabled={isSaving}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Expense"
                    {...register(`members.${index}.expense`, { valueAsNumber: true })}
                    className="col-span-3"
                    disabled={isSaving}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Balance"
                    {...register(`members.${index}.balance`, { valueAsNumber: true })}
                    className="col-span-3"
                    disabled={isSaving}
                  />
                  <div className="col-span-2 flex justify-end">
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isSaving}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                   {errors.members?.[index]?.name && <p className="col-span-12 text-xs text-destructive">{errors.members[index]?.name?.message}</p>}
                </div>
              ))}
            </div>
          </ScrollArea>
           {errors.members && <p className="text-sm text-destructive">{errors.members.message}</p>}

          <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", expense: 0, balance: 0 })} disabled={isSaving}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Member
          </Button>

          <Separator />

          <div className="flex justify-end items-center space-x-4">
            <span className="text-lg font-semibold">Total Expense:</span>
            <span className="text-lg font-bold font-headline text-primary">{formatCurrency(totalExpense, selectedCurrency)}</span>
          </div>

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
