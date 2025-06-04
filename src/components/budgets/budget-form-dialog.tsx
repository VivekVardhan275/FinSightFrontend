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
import type { Budget } from "@/types";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface BudgetFormDialogProps {
  budget?: Budget | null; // For editing
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (budget: Omit<Budget, 'id'> | Budget) => void;
}

const initialFormState: Omit<Budget, 'id' | 'spent'> = {
  category: "",
  allocated: 0,
  month: new Date().toISOString().slice(0, 7), // YYYY-MM format
};

export function BudgetFormDialog({
  budget,
  open,
  onOpenChange,
  onSave,
}: BudgetFormDialogProps) {
  const [formData, setFormData] = useState<Omit<Budget, 'id' | 'spent'>>(initialFormState);
  const { toast } = useToast();

  useEffect(() => {
    if (budget) {
      setFormData({
        category: budget.category,
        allocated: budget.allocated,
        month: budget.month,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [budget, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "allocated" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || formData.allocated <= 0 || !formData.month) {
      toast({
        title: "Validation Error",
        description: "Please fill in category, a positive allocated amount, and month.",
        variant: "destructive",
      });
      return;
    }
    
    const budgetDataToSave: Omit<Budget, 'id'> | Budget = budget 
      ? { ...budget, ...formData } // Preserve spent amount if editing
      : { ...formData, spent: 0 }; // New budget starts with 0 spent

    onSave(budgetDataToSave);
    onOpenChange(false); // Close dialog on save
    toast({
      title: `Budget ${budget ? 'Updated' : 'Added'}`,
      description: `Budget for ${formData.category} successfully ${budget ? 'updated' : 'added'}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Input
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="allocated" className="text-right">Allocated Amount</Label>
            <Input
              id="allocated"
              name="allocated"
              type="number"
              step="0.01"
              value={formData.allocated}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="month" className="text-right">Month</Label>
            <Input
              id="month"
              name="month"
              type="month" // YYYY-MM format
              value={formData.month}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Budget</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
