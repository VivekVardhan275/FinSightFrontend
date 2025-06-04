
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
import { motion } from "framer-motion";
import { useCurrency } from "@/contexts/currency-context";
import { v4 as uuidv4 } from 'uuid';

interface BudgetFormDialogProps {
  budget?: Budget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (budgetData: Omit<Budget, 'id' | 'spent'> | Budget) => void;
}

const getDefaultMonth = () => new Date().toISOString().slice(0, 7);

const getBudgetSchema = (selectedCurrency: string) => z.object({
  category: z.string().min(1, "Category is required."),
  allocated: z.number().positive(`Allocated amount in ${selectedCurrency} must be positive.`),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format."),
});

export function BudgetFormDialog({
  budget,
  open,
  onOpenChange,
  onSave,
}: BudgetFormDialogProps) {
  const { selectedCurrency, convertAmount, conversionRates } = useCurrency();

  const budgetSchema = getBudgetSchema(selectedCurrency);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
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
        const displayAllocated = convertAmount(budget.allocated, selectedCurrency);
        reset({
          category: budget.category,
          allocated: parseFloat(displayAllocated.toFixed(2)),
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
  }, [budget, open, reset, selectedCurrency, convertAmount]);

  const processSubmit = (data: BudgetFormData) => {
    const allocatedInUSD = data.allocated / (conversionRates[selectedCurrency] || 1);

    const budgetDataToSaveBase = {
      category: data.category,
      allocated: allocatedInUSD,
      month: data.month,
    };

    const budgetDataToSave: Omit<Budget, 'id' | 'spent'> | Budget = budget
      ? { ...budget, ...budgetDataToSaveBase } // For editing, it's a full Budget.
      : budgetDataToSaveBase; // For new, it's Omit<Budget, 'id' | 'spent'>. Context will add id and spent.

    onSave(budgetDataToSave);
    onOpenChange(false);
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
              <Label htmlFor="allocated" className="text-right">Allocated ({selectedCurrency})</Label>
              <Input
                id="allocated"
                type="number"
                step="0.01"
                {...register("allocated", {
                    valueAsNumber: true,
                    onChange: (e) => setValue("allocated", parseFloat(parseFloat(e.target.value).toFixed(2)))
                })}
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
