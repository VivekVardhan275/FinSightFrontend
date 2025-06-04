
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Target } from "lucide-react";
import type { Budget } from "@/types";
import { BudgetCard } from '@/components/budgets/budget-card';
import { BudgetFormDialog } from '@/components/budgets/budget-form-dialog';
import { useNotification } from '@/contexts/notification-context';
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
import { useBudgetContext } from '@/contexts/budget-context';
import { useTransactionContext } from '@/contexts/transaction-context';

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
  const { budgets, addBudget, updateBudget, deleteBudget: deleteBudgetFromContext, updateBudgetSpentAmount } = useBudgetContext();
  const { transactions } = useTransactionContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [budgetToDeleteId, setBudgetToDeleteId] = useState<string | null>(null);
  
  const { addNotification } = useNotification();

  // Removed the useEffect that recalculated all budget spent amounts on [transactions, budgets] change
  // as it was potentially causing update loops or race conditions.
  // Spent amounts are now updated more directly:
  // 1. In handleSaveBudget for the specific budget being saved/added.
  // 2. In TransactionsPage when transactions are modified, affecting relevant budgets.
  // 3. The BudgetNotificationEffect in layout.tsx reads spent amounts but doesn't modify them in context.


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
      deleteBudgetFromContext(budgetToDeleteId);
      addNotification({
        title: "Budget Deleted",
        description: `The budget has been successfully deleted.`,
        type: "info",
      });
      setBudgetToDeleteId(null);
    }
    setIsConfirmDeleteDialogOpen(false);
  };

  const handleSaveBudget = useCallback((budgetDataFromForm: Omit<Budget, 'id' | 'spent'> | Budget) => {
    let savedCategory = "";
    let savedBudget: Budget;
    let notificationAction = "Added";

    const formHasId = 'id' in budgetDataFromForm && typeof (budgetDataFromForm as Budget).id === 'string';
    const existingBudgetInContext = formHasId ? budgets.find(b => b.id === (budgetDataFromForm as Budget).id) : undefined;

    if (formHasId && existingBudgetInContext) {
      notificationAction = "Updated";
      const budgetToUpdate: Budget = {
        ...existingBudgetInContext,
        ...(budgetDataFromForm as Budget), 
      };
      updateBudget(budgetToUpdate); 
      savedBudget = budgetToUpdate;
    } else {
      savedBudget = addBudget(budgetDataFromForm as Omit<Budget, 'id' | 'spent'>);
    }
    
    savedCategory = savedBudget.category;
    // Crucially, ensure the spent amount for the just-saved/added budget is correct.
    // For a new budget, its 'spent' is initialized to 0 by addBudget.
    // Then updateBudgetSpentAmount will calculate based on existing transactions.
    // For an edited budget, this ensures its spent is recalculated if category/month changed.
    updateBudgetSpentAmount(savedBudget.id, transactions); 

    addNotification({
        title: `Budget ${notificationAction}`,
        description: `Budget for ${savedCategory} successfully ${notificationAction.toLowerCase()}.`,
        type: 'success',
        href: '/budgets'
      });
  }, [budgets, transactions, addBudget, updateBudget, updateBudgetSpentAmount, addNotification]);


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

    