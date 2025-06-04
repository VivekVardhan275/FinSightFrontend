
"use client";

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
import type { Budget, BudgetFormData } from "@/types";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface BudgetFormDialogProps {
  budget?: Budget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (budgetData: Omit<Budget, 'id'> | Budget) => void;
}

const budgetSchema = z.object({
  category: z.string().min(1, "Category is required."),
  allocated: z.number().positive("Allocated amount must be positive."),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format."),
});

const getDefaultMonth = () => new Date().toISOString().slice(0, 7);

export function BudgetFormDialog({
  budget,
  open,
  onOpenChange,
  onSave,
}: BudgetFormDialogProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: "",
      allocated: 0,
      month: getDefaultMonth(),
    },
  });

  useEffect(() => {
    if (open) {
      if (budget) {
        reset({
          category: budget.category,
          allocated: budget.allocated,
          month: budget.month,
        });
      } else {
        reset({
          category: "",
          allocated: 0,
          month: getDefaultMonth(),
        });
      }
    }
  }, [budget, open, reset]);

  const processSubmit = (data: BudgetFormData) => {
    const budgetDataToSave: Omit<Budget, 'id'> | Budget = budget
      ? { ...budget, ...data } // Preserve spent amount if editing
      : { ...data, spent: 0 }; // New budget starts with 0 spent

    onSave(budgetDataToSave);
    onOpenChange(false);
    toast({
      title: `Budget ${budget ? 'Updated' : 'Added'}`,
      description: `Budget for ${data.category} successfully ${budget ? 'updated' : 'added'}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <DialogHeader>
            <DialogTitle className="font-headline">
              {budget ? "Edit Budget" : "Add New Budget"}
            </DialogTitle>
            <DialogDescription>
              {budget
                ? "Update the details of your budget."
                : "Set a new monthly budget for a category."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <Input
                id="category"
                {...register("category")}
                className="col-span-3"
              />
              {errors.category && <p className="col-span-4 text-sm text-destructive text-right">{errors.category.message}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="allocated" className="text-right">Allocated Amount</Label>
              <Input
                id="allocated"
                type="number"
                step="0.01"
                {...register("allocated", { valueAsNumber: true })}
                className="col-span-3"
              />
              {errors.allocated && <p className="col-span-4 text-sm text-destructive text-right">{errors.allocated.message}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="month" className="text-right">Month</Label>
              <Input
                id="month"
                type="month"
                {...register("month")}
                className="col-span-3"
              />
              {errors.month && <p className="col-span-4 text-sm text-destructive text-right">{errors.month.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Budget</Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
