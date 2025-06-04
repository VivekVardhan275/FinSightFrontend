
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Target } from "lucide-react";
import { sampleBudgets } from "@/lib/placeholder-data";
import type { Budget } from "@/types";
import { BudgetCard } from '@/components/budgets/budget-card';
import { BudgetFormDialog } from '@/components/budgets/budget-form-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { useCurrency } from '@/contexts/currency-context';
import { formatCurrency } from '@/lib/utils';

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>(sampleBudgets);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [budgetToDeleteId, setBudgetToDeleteId] = useState<string | null>(null);
  const [notifiedBudgets, setNotifiedBudgets] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const { selectedCurrency, convertAmount } = useCurrency();

  const checkAndNotifyBudgets = (budgetsToCheck: Budget[]) => {
    budgetsToCheck.forEach(budget => {
      // Calculate percentage based on base USD values
      const percentageSpent = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0;
      const budgetId = budget.id;

      // Convert amounts for display in toasts
      const displaySpent = convertAmount(budget.spent, selectedCurrency);
      const displayAllocated = convertAmount(budget.allocated, selectedCurrency);

      const exceededKey = `${budgetId}-exceeded`;
      const nearingKey = `${budgetId}-nearing`;

      if (budget.spent > budget.allocated) {
        if (!notifiedBudgets.has(exceededKey)) {
          toast({
            title: "Budget Exceeded!",
            description: `You have exceeded your budget for ${budget.category} (${budget.month}). Spent: ${formatCurrency(displaySpent, selectedCurrency)}, Allocated: ${formatCurrency(displayAllocated, selectedCurrency)}.`,
            variant: "destructive",
            duration: 10000,
          });
          setNotifiedBudgets(prev => {
            const newSet = new Set(prev);
            newSet.add(exceededKey);
            newSet.delete(nearingKey); // Remove nearing if it was previously nearing
            return newSet;
          });
        }
      } else if (percentageSpent >= 85) {
        if (!notifiedBudgets.has(nearingKey) && !notifiedBudgets.has(exceededKey)) {
          toast({
            title: "Budget Nearing Limit",
            description: `You have spent ${percentageSpent.toFixed(0)}% of your budget for ${budget.category} (${budget.month}). Spent: ${formatCurrency(displaySpent, selectedCurrency)}, Allocated: ${formatCurrency(displayAllocated, selectedCurrency)}.`,
            variant: "default",
            duration: 10000,
          });
          setNotifiedBudgets(prev => new Set(prev).add(nearingKey));
        }
      } else {
        // Budget is okay, remove from notified set so it can be notified again if status changes
        let changed = false;
        const newSet = new Set(notifiedBudgets);
        if (newSet.has(nearingKey)) {
          newSet.delete(nearingKey);
          changed = true;
        }
        if (newSet.has(exceededKey)) {
          newSet.delete(exceededKey);
          changed = true;
        }
        if (changed) {
          setNotifiedBudgets(newSet);
        }
      }
    });
  };
  
  useEffect(() => {
    if (budgets.length > 0) {
      checkAndNotifyBudgets(budgets);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgets, selectedCurrency]); // Rerun when budgets or currency changes


  const handleAddBudget = () => {
    setEditingBudget(null);
    setIsFormOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const confirmDeleteBudget = (budgetId: string) => {
    setBudgetToDeleteId(budgetId);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeleteBudget = () => {
     if (budgetToDeleteId) {
      setBudgets(prev => prev.filter(b => b.id !== budgetToDeleteId));
      toast({
        title: "Budget Deleted",
        description: "The budget has been successfully deleted.",
      });
      // Clear notification for deleted budget
      setNotifiedBudgets(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${budgetToDeleteId}-nearing`);
        newSet.delete(`${budgetToDeleteId}-exceeded`);
        return newSet;
      });
      setBudgetToDeleteId(null);
    }
    setIsConfirmDeleteDialogOpen(false);
  };
  
  const handleSaveBudget = (budgetDataFromForm: Omit<Budget, 'id' | 'spent'> | Budget) => {
    if ('id' in budgetDataFromForm && 'spent' in budgetDataFromForm) { 
      setBudgets(prev => prev.map(b => b.id === budgetDataFromForm.id ? budgetDataFromForm : b));
    } else { 
      const newBudget: Budget = { 
        ...(budgetDataFromForm as Omit<Budget, 'id' | 'spent'>), 
        id: Date.now().toString(), 
        spent: 0 
      };
      setBudgets(prev => [newBudget, ...prev]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.5 }}
            className="font-headline text-3xl font-bold tracking-tight"
          >
            Budgets
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground"
          >
            Set and track your monthly spending goals.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Button onClick={handleAddBudget}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Budget
          </Button>
        </motion.div>
      </div>

      {budgets.length > 0 ? (
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {budgets.map((budget) => (
            <BudgetCard 
              key={budget.id} 
              budget={budget} 
              onEdit={handleEditBudget} 
              onDelete={confirmDeleteBudget}
              variants={itemVariants}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div 
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
            <Target className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No budgets yet</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Start by creating a new budget to track your spending.
            </p>
            <Button onClick={handleAddBudget}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Budget
            </Button>
        </motion.div>
      )}
      
      <BudgetFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        budget={editingBudget}
        onSave={handleSaveBudget}
      />

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this budget.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBudgetToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBudget} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
