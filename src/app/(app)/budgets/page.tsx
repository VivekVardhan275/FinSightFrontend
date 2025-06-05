
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
import { useBudgetContext } from '@/contexts/budget-context';
import { useTransactionContext } from '@/contexts/transaction-context';
import { useCurrency } from '@/contexts/currency-context';
import { formatCurrency } from '@/lib/utils';
import { motion } from "framer-motion";

const pageHeaderBlockMotionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5 } }, // Delay removed
};

const buttonMotionVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.2 } },
};

const gridContainerMotionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.3,
      duration: 0.5,
    },
  },
};

const budgetCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.07,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

const emptyStateMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
};


export default function BudgetsPage() {
  const { budgets, addBudget, updateBudget, deleteBudget: deleteBudgetFromContext, updateBudgetSpentAmount } = useBudgetContext();
  const { transactions } = useTransactionContext();
  const { selectedCurrency, convertAmount } = useCurrency();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [budgetToDeleteId, setBudgetToDeleteId] = useState<string | null>(null);

  const { addNotification } = useNotification();

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
    const newBudgetCategoryLower = budgetDataFromForm.category.toLowerCase();
    const newBudgetMonth = budgetDataFromForm.month;
    const newBudgetAllocatedUSD = (budgetDataFromForm as Budget).allocated;


    const existingBudgetWithSameCategoryMonth = budgets.find(existingBudget => {
      if ('id' in budgetDataFromForm && (budgetDataFromForm as Budget).id && existingBudget.id === (budgetDataFromForm as Budget).id) {
        return false;
      }
      return existingBudget.category.toLowerCase() === newBudgetCategoryLower &&
             existingBudget.month === newBudgetMonth;
    });

    if (existingBudgetWithSameCategoryMonth) {
      if (existingBudgetWithSameCategoryMonth.allocated === newBudgetAllocatedUSD) {
        addNotification({
          title: "Duplicate Budget",
          description: `A budget for ${budgetDataFromForm.category} in ${newBudgetMonth} with the same allocated amount already exists.`,
          type: "error",
        });
      } else {
        const oldAllocatedInSelectedCurrency = convertAmount(existingBudgetWithSameCategoryMonth.allocated, selectedCurrency);
        const formattedOldAmount = formatCurrency(oldAllocatedInSelectedCurrency, selectedCurrency);
        addNotification({
          title: "Update Existing Budget?",
          description: `A budget for ${budgetDataFromForm.category} in ${newBudgetMonth} already exists with allocated amount ${formattedOldAmount}. If you want to change the allocation, please edit the existing budget.`,
          type: "warning",
        });
      }
      setIsFormOpen(false);
      return;
    }

    let savedCategory = "";
    let savedBudget: Budget;
    let notificationAction = "Added";

    const isActualEditOperation = 'id' in budgetDataFromForm && budgets.some(b => b.id === (budgetDataFromForm as Budget).id);


    if (isActualEditOperation) {
      notificationAction = "Updated";
      const budgetToUpdate = {
        ...budgets.find(b => b.id === (budgetDataFromForm as Budget).id)!,
        ...(budgetDataFromForm as Budget),
      };
      updateBudget(budgetToUpdate);
      savedBudget = budgetToUpdate;
    } else {
      savedBudget = addBudget(budgetDataFromForm as Omit<Budget, 'id' | 'spent'>);
    }

    savedCategory = savedBudget.category;
    updateBudgetSpentAmount(savedBudget.id, transactions);

    addNotification({
        title: `Budget ${notificationAction}`,
        description: `Budget for ${savedCategory} successfully ${notificationAction.toLowerCase()}.`,
        type: 'success',
        href: '/budgets'
      });
    setIsFormOpen(false);
  }, [budgets, transactions, addBudget, updateBudget, updateBudgetSpentAmount, addNotification, setIsFormOpen, selectedCurrency, convertAmount]);


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <motion.div initial="initial" animate="animate" variants={pageHeaderBlockMotionVariants} viewport={{ once: true }}>
          <h1
            className="font-headline text-3xl font-bold tracking-tight"
          >
            Budgets
          </h1>
          <p
            className="text-muted-foreground"
          >
            Set and track your monthly spending goals.
          </p>
        </motion.div>
        <motion.div initial="initial" animate="animate" variants={buttonMotionVariants} viewport={{ once: true }}>
          <Button onClick={handleAddBudget}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Budget
          </Button>
        </motion.div>
      </div>

      {budgets.length > 0 ? (
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={gridContainerMotionVariants}
          viewport={{ once: true }}
        >
          {budgets.map((budget, index) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEditBudget}
              onDelete={confirmDeleteBudget}
              variants={budgetCardVariants}
              custom={index}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center"
          initial="initial"
          animate="animate"
          variants={emptyStateMotionVariants}
          viewport={{ once: true }}
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
