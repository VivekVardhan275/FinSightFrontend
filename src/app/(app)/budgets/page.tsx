
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
    // budgetDataFromForm.allocated is already in USD from BudgetFormDialog
    const newBudgetAllocatedUSD = (budgetDataFromForm as Budget).allocated;


    const existingBudgetWithSameCategoryMonth = budgets.find(existingBudget => {
      // If we are editing, and existingBudget is the one being edited, skip it for this specific check.
      if ('id' in budgetDataFromForm && (budgetDataFromForm as Budget).id && existingBudget.id === (budgetDataFromForm as Budget).id) {
        return false;
      }
      return existingBudget.category.toLowerCase() === newBudgetCategoryLower &&
             existingBudget.month === newBudgetMonth;
    });

    if (existingBudgetWithSameCategoryMonth) {
      // A budget for the same category and month already exists (and it's not the one being edited).
      // Now check if the allocated amount is also the same.
      if (existingBudgetWithSameCategoryMonth.allocated === newBudgetAllocatedUSD) {
        addNotification({
          title: "Duplicate Budget",
          description: `A budget for ${budgetDataFromForm.category} in ${newBudgetMonth} with the same allocated amount already exists.`,
          type: "error",
        });
      } else {
        // Same category/month, but different allocated amount. Suggest updating.
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
      // For a new budget, budgetDataFromForm is Omit<Budget, 'id' | 'spent'>
      // It already has allocated in USD.
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
        <div>
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
        </div>
        <div>
          <Button onClick={handleAddBudget}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Budget
          </Button>
        </div>
      </div>

      {budgets.length > 0 ? (
        <div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEditBudget}
              onDelete={confirmDeleteBudget}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center"
        >
            <Target className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No budgets yet</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Start by creating a new budget to track your spending.
            </p>
            <Button onClick={handleAddBudget}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Budget
            </Button>
        </div>
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
