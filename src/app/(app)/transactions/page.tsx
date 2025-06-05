
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, RotateCw } from "lucide-react";
import { DataTable } from "@/components/transactions/data-table";
import { getColumns } from "@/components/transactions/transaction-table-columns";
import type { Transaction } from "@/types";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
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
import { useTransactionContext } from '@/contexts/transaction-context';
import { useBudgetContext } from '@/contexts/budget-context';
import { format, parseISO } from 'date-fns';
import { useCurrency } from '@/contexts/currency-context';
import { formatCurrency } from '@/lib/utils';
import { motion } from "framer-motion";
import { useAuthState } from '@/hooks/use-auth-state'; // Import useAuthState
import axios from 'axios'; // Import axios

const TRANSACTION_API_BASE_URL = "http://localhost:8080/api/user/transactions";


const buttonMotionVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.2 } },
};

const tableMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.25 } },
};


export default function TransactionsPage() {
  const { user } = useAuthState(); // Get user for email
  const { transactions, addTransaction, updateTransaction, deleteTransaction: deleteTransactionFromContext } = useTransactionContext();
  const { budgets, updateBudgetSpentAmount } = useBudgetContext();
  const { selectedCurrency, convertAmount } = useCurrency();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); // For API call loading state

  const { addNotification } = useNotification();

  const refreshAffectedBudgets = (transactionDetails: Transaction | { category: string; date: string; type?: 'income' | 'expense' }) => {
    if (transactionDetails.type && transactionDetails.type !== 'expense') {
      return;
    }
    const transactionDate = new Date(transactionDetails.date);
    const year = transactionDate.getFullYear();
    const month = transactionDate.getMonth() + 1;
    const transactionCategoryLower = transactionDetails.category.toLowerCase();

    const affectedBudgets = budgets.filter(b => {
      const budgetMonthYear = b.month.split('-');
      return b.category.toLowerCase() === transactionCategoryLower &&
             parseInt(budgetMonthYear[0]) === year &&
             parseInt(budgetMonthYear[1]) === month;
    });

    affectedBudgets.forEach(budget => {
      // Pass the latest transactions list for accurate calculation
      updateBudgetSpentAmount(budget.id, transactions); 
    });
  };


  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const confirmDeleteTransaction = (transactionId: string) => {
    setTransactionToDeleteId(transactionId);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeleteTransaction = () => {
    // TODO: Implement API call for delete if needed
    if (transactionToDeleteId) {
      const transactionToDelete = transactions.find(t => t.id === transactionToDeleteId);
      deleteTransactionFromContext(transactionToDeleteId);
      addNotification({
        title: "Transaction Deleted",
        description: "The transaction has been successfully deleted.",
        type: "info",
      });

      if (transactionToDelete && transactionToDelete.type === 'expense') {
        const remainingTransactions = transactions.filter(t => t.id !== transactionToDeleteId);
        refreshAffectedBudgets(transactionToDelete); // Pass the deleted transaction's details
      }
      setTransactionToDeleteId(null);
    }
    setIsConfirmDeleteDialogOpen(false);
  };

  const handleSaveTransaction = async (transactionDataFromForm: Transaction) => {
    if (!user || !user.email) {
      addNotification({ title: "Error", description: "User not authenticated. Cannot save transaction.", type: "error" });
      return;
    }
    setIsSaving(true);

    // Existing duplicate and similarity checks can remain, or be adapted if backend handles them
    const formTxDate = transactionDataFromForm.date;
    const formTxDescriptionLower = transactionDataFromForm.description.toLowerCase();
    const formTxCategoryLower = transactionDataFromForm.category.toLowerCase();
    const formTxAmountUSD = transactionDataFromForm.amount; // This is already in USD from the form
    const formTxType = transactionDataFromForm.type;

    const isActualEditOperation = editingTransaction && transactions.some(t => t.id === transactionDataFromForm.id);

    if (!isActualEditOperation) { // Check for similar if adding new
        const similarExistingTx = transactions.find(existingTx =>
            existingTx.date === formTxDate &&
            existingTx.description.toLowerCase() === formTxDescriptionLower &&
            existingTx.category.toLowerCase() === formTxCategoryLower &&
            existingTx.type === formTxType &&
            existingTx.amount !== formTxAmountUSD
        );

        if (similarExistingTx) {
            const oldAmountInSelectedCurrency = convertAmount(similarExistingTx.amount, selectedCurrency);
            const formattedOldAmount = formatCurrency(oldAmountInSelectedCurrency, selectedCurrency);
            addNotification({
                title: "Review Transaction",
                description: `A transaction for '${transactionDataFromForm.description}' (${transactionDataFromForm.category}, ${formTxType}) on ${format(parseISO(formTxDate), "PPP")} already exists with amount ${formattedOldAmount}. If this is a correction, please edit the existing one. To add as new, consider altering the description.`,
                type: "warning",
            });
            setIsFormOpen(false);
            setIsSaving(false);
            return;
        }
    }

    const exactDuplicateTx = transactions.find(existingTx => {
        if (isActualEditOperation && existingTx.id === transactionDataFromForm.id) {
            return false;
        }
        return existingTx.date === formTxDate &&
               existingTx.description.toLowerCase() === formTxDescriptionLower &&
               existingTx.category.toLowerCase() === formTxCategoryLower &&
               existingTx.amount === formTxAmountUSD &&
               existingTx.type === formTxType;
    });

    if (exactDuplicateTx) {
        addNotification({
            title: "Duplicate Transaction",
            description: "An identical transaction already exists. The current operation was not saved.",
            type: "error",
        });
        setIsFormOpen(false);
        setIsSaving(false);
        return;
    }

    let originalTransactionDetailsForEdit: { category: string; date: string; type: 'income' | 'expense', amount: number } | undefined = undefined;

    try {
      if (isActualEditOperation) {
        const originalTx = transactions.find(t => t.id === transactionDataFromForm.id);
        if (originalTx) {
            originalTransactionDetailsForEdit = { category: originalTx.category, date: originalTx.date, type: originalTx.type, amount: originalTx.amount };
        }
        // API Call for UPDATE
        await axios.put(`${TRANSACTION_API_BASE_URL}/${transactionDataFromForm.id}?email=${encodeURIComponent(user.email)}`, transactionDataFromForm);
        updateTransaction(transactionDataFromForm);
        addNotification({
            title: `Transaction Updated`,
            description: `${transactionDataFromForm.description} successfully updated.`,
            type: "success",
            href: "/transactions"
        });

      } else { // Adding new transaction
        // API Call for ADD
        // The backend might return the created transaction, potentially with a backend-generated ID.
        // For now, we assume the frontend-generated ID in transactionDataFromForm is used or accepted.
        await axios.post(`${TRANSACTION_API_BASE_URL}?email=${encodeURIComponent(user.email)}`, transactionDataFromForm);
        addTransaction(transactionDataFromForm); // Context function now accepts full Transaction object
        addNotification({
            title: `Transaction Added`,
            description: `${transactionDataFromForm.description} successfully added.`,
            type: "success",
            href: "/transactions"
        });
      }

      setIsFormOpen(false);

      // Budget refresh logic - needs to use the final state of transactions
      // Run this after state update from addTransaction/updateTransaction has likely settled
      // Or better, ensure transactions passed to refreshAffectedBudgets is the *new* list
      const updatedTransactionsList = isActualEditOperation
        ? transactions.map(t => t.id === transactionDataFromForm.id ? transactionDataFromForm : t)
        : [transactionDataFromForm, ...transactions];


      if (isActualEditOperation && originalTransactionDetailsForEdit) {
          const oldCat = originalTransactionDetailsForEdit.category;
          const oldDate = originalTransactionDetailsForEdit.date;
          const oldType = originalTransactionDetailsForEdit.type;

          // If critical fields for budget linking changed OR type changed from/to expense
          if (oldType === 'expense' &&
              (oldCat.toLowerCase() !== transactionDataFromForm.category.toLowerCase() ||
               oldDate.substring(0,7) !== transactionDataFromForm.date.substring(0,7) ||
               transactionDataFromForm.type !== 'expense')) {
              refreshAffectedBudgets({ category: oldCat, date: oldDate, type: 'expense' });
          }
      }
      if (transactionDataFromForm.type === 'expense') {
          refreshAffectedBudgets(transactionDataFromForm);
      }

    } catch (error) {
      console.error("Error saving transaction:", error);
      const action = isActualEditOperation ? "updating" : "adding";
      addNotification({
        title: `Error ${action} transaction`,
        description: `Failed to save transaction. Please try again. ${axios.isAxiosError(error) && error.response?.data?.message ? error.response.data.message : ""}`,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo(() => getColumns(handleEditTransaction, confirmDeleteTransaction), [transactions, budgets, selectedCurrency, convertAmount]); //eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Manage your income and expenses.</p>
        </div>
        <motion.div initial="initial" animate="animate" variants={buttonMotionVariants} viewport={{ once: true }}>
          <Button onClick={handleAddTransaction}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Transaction
          </Button>
        </motion.div>
      </div>

      <motion.div initial="initial" animate="animate" variants={tableMotionVariants} viewport={{ once: true }}>
        <DataTable columns={columns} data={transactions} />
      </motion.div>

      <TransactionFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transaction={editingTransaction}
        onSave={handleSaveTransaction} // This will now be an async function
        isSaving={isSaving} // Pass saving state to dialog
      />

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransactionToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

