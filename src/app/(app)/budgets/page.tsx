
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Target, RotateCw } from "lucide-react";
import type { Budget, BudgetFormData, Transaction } from "@/types";
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
import { useAuthState } from '@/hooks/use-auth-state';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const BUDGET_API_BASE_URL = `${backendUrl}/api/user/budgets`;

const addRandomQueryParam = (url: string, paramName: string = '_cb'): string => {
  const randomString = Math.random().toString(36).substring(2, 10);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${paramName}=${randomString}`;
};

// Type for budget data received from API (without 'spent')
type BudgetFromApi = Omit<Budget, 'spent'>;


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
  const { user } = useAuthState();
  const { budgets, isLoading: isLoadingBudgets, addBudget, updateBudget, deleteBudget: deleteBudgetFromContext } = useBudgetContext();
  const { transactions: pageTransactions, isLoading: isLoadingPageTransactions } = useTransactionContext(); // Get transactions here
  const { selectedCurrency, convertAmount, conversionRates } = useCurrency();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [budgetToDeleteId, setBudgetToDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteBudget = async () => {
     if (!budgetToDeleteId || !user || !user.email) {
        addNotification({ title: "Error", description: "Cannot delete budget. User or budget ID missing.", type: "error" });
        setIsConfirmDeleteDialogOpen(false);
        return;
     }
    setIsDeleting(true);

    try {
      const apiUrl = `${BUDGET_API_BASE_URL}/${budgetToDeleteId}?email=${encodeURIComponent(user.email)}`;
      await axios.delete(addRandomQueryParam(apiUrl));
      deleteBudgetFromContext(budgetToDeleteId);
      addNotification({
        title: "Budget Deleted",
        description: `The budget has been successfully deleted.`,
        type: "info",
      });
      setBudgetToDeleteId(null);
    } catch (error) {
      console.error("API error deleting budget.");
      if (axios.isAxiosError(error) && error.response) {
        console.error("Backend error message:", error.response.data?.message || error.response.data?.error || "No specific message from backend.");
        console.error("Status code:", error.response.status);
      } else if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      addNotification({
        title: "Error Deleting Budget",
        description: `Failed to delete budget. Please try again. ${axios.isAxiosError(error) && error.response?.data?.message ? error.response.data.message : ""}`,
        type: "error",
      });
    } finally {
      setIsDeleting(false);
      setIsConfirmDeleteDialogOpen(false);
    }
  };

  const handleSaveBudget = async (formData: BudgetFormData) => {
    if (!user || !user.email) {
      addNotification({ title: "Error", description: "User not authenticated. Cannot save budget.", type: "error" });
      return;
    }
    setIsSaving(true);

    const allocatedInINR = formData.allocated / (conversionRates[selectedCurrency] || 1);
    const newBudgetCategoryLower = formData.category.toLowerCase();
    const newBudgetMonth = formData.month;

    const isActualEditOperation = editingBudget !== null;

    const existingBudgetWithSameCategoryMonth = budgets.find(existingBudget => {
      if (isActualEditOperation && editingBudget && existingBudget.id === editingBudget.id) {
        return false;
      }
      return existingBudget.category.toLowerCase() === newBudgetCategoryLower &&
             existingBudget.month === newBudgetMonth;
    });

    if (existingBudgetWithSameCategoryMonth) {
      if (Math.abs(existingBudgetWithSameCategoryMonth.allocated - allocatedInINR) < 0.005) {
        const oldAllocatedInSelectedCurrency = convertAmount(existingBudgetWithSameCategoryMonth.allocated, selectedCurrency);
        const formattedOldAmount = formatCurrency(oldAllocatedInSelectedCurrency, selectedCurrency);
        addNotification({
          title: "Duplicate Budget",
          description: `A budget for ${formData.category} in ${newBudgetMonth} with allocated amount ${formattedOldAmount} already exists.`,
          type: "error",
        });
      } else {
        const oldAllocatedInSelectedCurrency = convertAmount(existingBudgetWithSameCategoryMonth.allocated, selectedCurrency);
        const formattedOldAmount = formatCurrency(oldAllocatedInSelectedCurrency, selectedCurrency);
        addNotification({
          title: "Update Existing Budget?",
          description: `A budget for ${formData.category} in ${newBudgetMonth} already exists with allocated amount ${formattedOldAmount}. If you want to change the allocation, please edit the existing budget.`,
          type: "warning",
        });
      }
      setIsFormOpen(false);
      setIsSaving(false);
      return;
    }

    const dataForApi = {
      category: formData.category,
      allocated: allocatedInINR,
      month: formData.month,
    };

    let notificationAction = isActualEditOperation ? "Updated" : "Added";

    try {
      let savedBudgetFromApi: BudgetFromApi;

      if (isActualEditOperation && editingBudget) {
        const apiUrl = `${BUDGET_API_BASE_URL}/${editingBudget.id}?email=${encodeURIComponent(user.email)}`;
        const response = await axios.put<BudgetFromApi>(addRandomQueryParam(apiUrl), dataForApi);
        savedBudgetFromApi = response.data;
        updateBudget(savedBudgetFromApi, pageTransactions);
      } else {
        const apiUrl = `${BUDGET_API_BASE_URL}?email=${encodeURIComponent(user.email)}`;
        const response = await axios.post<BudgetFromApi>(addRandomQueryParam(apiUrl), dataForApi);
        savedBudgetFromApi = response.data;
        addBudget(savedBudgetFromApi); 
      }

      addNotification({
          title: `Budget ${notificationAction}`,
          description: `Budget for ${savedBudgetFromApi.category} successfully ${notificationAction.toLowerCase()}.`,
          type: 'success',
          href: '/budgets'
        });
      setIsFormOpen(false);
      setEditingBudget(null);

    } catch (error) {
       console.error(`API error ${notificationAction.toLowerCase()} budget.`);
        if (axios.isAxiosError(error) && error.response) {
            console.error("Backend error message:", error.response.data?.message || error.response.data?.error || "No specific message from backend.");
            console.error("Status code:", error.response.status);
        } else if (error instanceof Error) {
            console.error("Error details:", error.message);
        }
        addNotification({
            title: `Error ${notificationAction} Budget`,
            description: `Failed to ${notificationAction.toLowerCase()} budget. Please try again. ${axios.isAxiosError(error) && error.response?.data?.message ? error.response.data.message : ""}`,
            type: 'error',
        });
    } finally {
        setIsSaving(false);
    }
  };


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
        <motion.div initial="initial" animate="animate" variants={buttonMotionVariants} viewport={{ once: true }}>
          <Button onClick={handleAddBudget} disabled={isLoadingBudgets || isLoadingPageTransactions}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Budget
          </Button>
        </motion.div>
      </div>

      {(isLoadingBudgets || isLoadingPageTransactions) ? (
        <div className="flex items-center justify-center p-10">
          <RotateCw className="mr-2 h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading budgets...</p>
        </div>
      ) : budgets.length > 0 ? (
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
        isSaving={isSaving}
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
            <AlertDialogCancel onClick={() => setBudgetToDeleteId(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteBudget}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
            >
              {isDeleting && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
