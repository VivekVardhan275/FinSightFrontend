// src/components/groups/group-expense-form-dialog.tsx
"use client";

import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar as CalendarIcon, RotateCw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { GroupExpenseFormData, GroupMember } from '@/types';
import { Separator } from "../ui/separator";

interface GroupExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: GroupExpenseFormData) => void;
  members: GroupMember[];
  isSaving?: boolean;
}

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.number().positive("Amount must be a positive number."),
  paidById: z.string().min(1, "Please select who paid."),
  date: z.date({ required_error: "Date is required." }),
  splitType: z.enum(["equally", "unequally"]),
  splits: z.record(z.number().min(0, "Split must be non-negative.")).optional(),
}).refine(data => {
  if (data.splitType === 'unequally') {
    if (!data.splits) return false; // Must have splits for unequal
    const totalSplit = Object.values(data.splits).reduce((sum, val) => sum + val, 0);
    // Use a small epsilon for float comparison
    return Math.abs(totalSplit - data.amount) < 0.01;
  }
  return true;
}, {
  message: "The sum of splits must equal the total amount.",
  path: ["splits"],
});

export function GroupExpenseFormDialog({
  open,
  onOpenChange,
  onSave,
  members,
  isSaving = false,
}: GroupExpenseFormDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<GroupExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: 0,
      paidById: "",
      date: new Date(),
      splitType: "equally",
      splits: members.reduce((acc, member) => ({ ...acc, [member.id]: 0 }), {}),
    },
  });

  const splitType = watch("splitType");
  const totalAmount = watch("amount");
  const splits = watch("splits");

  const splitSum = React.useMemo(() => {
    if (!splits) return 0;
    return Object.values(splits).reduce((sum, val) => sum + (val || 0), 0);
  }, [splits]);

  useEffect(() => {
    if (open) {
      reset({
        description: "",
        amount: 0,
        paidById: "",
        date: new Date(),
        splitType: "equally",
        splits: members.reduce((acc, member) => ({ ...acc, [member.id]: 0 }), {}),
      });
    }
  }, [open, reset, members]);
  
  const processSubmit = (data: GroupExpenseFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={!isSaving ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Add Group Expense</DialogTitle>
          <DialogDescription>
            Record a new expense and how it was split among members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} disabled={isSaving} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount", { valueAsNumber: true })} disabled={isSaving} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSaving}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidById">Paid By</Label>
            <Controller
              name="paidById"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                  <SelectTrigger><SelectValue placeholder="Select who paid" /></SelectTrigger>
                  <SelectContent>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.paidById && <p className="text-sm text-destructive">{errors.paidById.message}</p>}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>How to split?</Label>
            <Controller
              name="splitType"
              control={control}
              render={({ field }) => (
                <ToggleGroup type="single" value={field.value} onValueChange={field.onChange} className="w-full" disabled={isSaving}>
                  <ToggleGroupItem value="equally" className="w-1/2">Equally</ToggleGroupItem>
                  <ToggleGroupItem value="unequally" className="w-1/2">Unequally</ToggleGroupItem>
                </ToggleGroup>
              )}
            />
          </div>

          {splitType === 'unequally' && (
            <div className="space-y-3 pt-2">
              <Label>Enter Shares</Label>
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between gap-4">
                  <span>{member.name}</span>
                  <Input type="number" step="0.01" {...register(`splits.${member.id}`, { valueAsNumber: true })} className="w-32" disabled={isSaving} />
                </div>
              ))}
              <div className={cn("text-sm text-right pr-2", Math.abs(splitSum - totalAmount) < 0.01 ? "text-green-600" : "text-destructive")}>
                Total: ${splitSum.toFixed(2)} / ${totalAmount.toFixed(2)}
              </div>
              {errors.splits && <p className="text-sm text-destructive text-center">{errors.splits.message}</p>}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
              Save Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
