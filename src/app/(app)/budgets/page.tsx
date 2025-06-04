
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


export default function BudgetsPage() {
  const { budgets, addBudget, updateBudget, deleteBudget: deleteBudgetFromContext, updateBudgetSpentAmount } = useBudgetContext();
  const { transactions } = useTransactionContext();
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

    const isDuplicate = budgets.some(existingBudget => {
      // If we are editing and existingBudget is the one being edited, don't consider it a duplicate of itself.
      if ('id' in budgetDataFromForm && existingBudget.id === (budgetDataFromForm as Budget).id) {
        return false; 
      }
      return existingBudget.category.toLowerCase() === newBudgetCategoryLower &&
             existingBudget.month === newBudgetMonth;
    });

    if (isDuplicate) {
      addNotification({
        title: "Duplicate Budget",
        description: `A budget for ${budgetDataFromForm.category} in ${newBudgetMonth} already exists or matches another budget.`,
        type: "error",
      });
      setIsFormOpen(false); 
      return; 
    }
    
    let savedCategory = "";
    let savedBudget: Budget;
    let notificationAction = "Added";
    let isActuallyAnEditOperationBudget = false;

    if ('id' in budgetDataFromForm && (budgetDataFromForm as Budget).id) {
        const existingBudget = budgets.find(b => b.id === (budgetDataFromForm as Budget).id);
        if (existingBudget) {
            isActuallyAnEditOperationBudget = true;
        }
    }

    if (isActuallyAnEditOperationBudget) {
      notificationAction = "Updated";
      const budgetToUpdate: Budget = {
        // Ensure we merge with existing context data if some fields aren't on budgetDataFromForm (like 'spent')
        ...budgets.find(b => b.id === (budgetDataFromForm as Budget).id)!, 
        ...(budgetDataFromForm as Budget), 
      };
      updateBudget(budgetToUpdate); 
      savedBudget = budgetToUpdate;
    } else {
      // The budgetDataFromForm for a new budget from dialog already has an ID.
      // The context's addBudget expects Omit<Budget, 'id' | 'spent'>.
      const { id, spent, ...newBudgetData } = budgetDataFromForm as Budget; // Remove form-generated id and spent
      savedBudget = addBudget(newBudgetData); // Context addBudget will assign new ID and spent:0
    }
    
    savedCategory = savedBudget.category;
    // Ensure spent amount is updated using *all* transactions, not just the 'transactions' from this page's scope
    // which might be stale if this is called from a different context or if transactions were updated elsewhere.
    // The updateBudgetSpentAmount function in the context should ideally use the transactions from its own context.
    // For now, assuming 'transactions' here is up-to-date enough for this immediate action.
    updateBudgetSpentAmount(savedBudget.id, transactions); 

    addNotification({
        title: `Budget ${notificationAction}`,
        description: `Budget for ${savedCategory} successfully ${notificationAction.toLowerCase()}.`,
        type: 'success',
        href: '/budgets'
      });
    setIsFormOpen(false); // Ensure form closes on successful save
  }, [budgets, transactions, addBudget, updateBudget, updateBudgetSpentAmount, addNotification, setIsFormOpen]);


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
