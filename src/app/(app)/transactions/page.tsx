
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, RotateCw, ListChecks as NoTransactionsIcon } from "lucide-react"; // Added NoTransactionsIcon
import { DataTable } from "@/components/transactions/data-table";
import { getColumns } from "@/components/transactions/transaction-table-columns";
import type { Transaction, TransactionFormData } from "@/types";
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
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/currency-context';
import { formatCurrency } from '@/lib/utils';
import { motion } from "framer-motion";
import { useAuthState } from '@/hooks/use-auth-state';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const TRANSACTION_API_BASE_URL = `${backendUrl}/api/user/transactions`;


const buttonMotionVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.2 } },
};

const tableMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.25 } },
};

const emptyStateMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
};


export default function TransactionsPage() {
  const { user } = useAuthState();
  const { transactions, addTransaction, updateTransaction, deleteTransaction: deleteTransactionFromContext, isLoading: isLoadingTransactions } = useTransactionContext();
  const { budgets, updateBudgetSpentAmount } = useBudgetContext();
  const { selectedCurrency, convertAmount, conversionRates } = useCurrency();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


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

  const handleDeleteTransaction = async () => {
    if (!transactionToDeleteId || !user || !user.email) {
      addNotification({ title: "Error", description: "Cannot delete transaction. User or transaction ID missing.", type: "error" });
      setIsConfirmDeleteDialogOpen(false);
      return;
    }
    setIsDeleting(true);

    try {
      await axios.delete(`${TRANSACTION_API_BASE_URL}/${transactionToDeleteId}?email=${encodeURIComponent(user.email)}`);

      const transactionToDelete = transactions.find(t => t.id === transactionToDeleteId);
      deleteTransactionFromContext(transactionToDeleteId);
      addNotification({
        title: "Transaction Deleted",
        description: "The transaction has been successfully deleted.",
        type: "info",
      });

      if (transactionToDelete && transactionToDelete.type === 'expense') {
        refreshAffectedBudgets(transactionToDelete);
      }
      setTransactionToDeleteId(null);

    } catch (error) {
      console.error("Error deleting transaction:", error);
      addNotification({
        title: "Error Deleting Transaction",
        description: `Failed to delete transaction. Please try again. ${axios.isAxiosError(error) && error.response?.data?.message ? error.response.data.message : ""}`,
        type: "error",
      });
    } finally {
      setIsDeleting(false);
      setIsConfirmDeleteDialogOpen(false);
    }
  };

  const handleSaveTransaction = async (formData: TransactionFormData) => {
    if (!user || !user.email) {
      addNotification({ title: "Error", description: "User not authenticated. Cannot save transaction.", type: "error" });
      return;
    }
    setIsSaving(true);

    const amountInINR = formData.amount / (conversionRates[selectedCurrency] || 1);
    const formattedDate = format(formData.date, "yyyy-MM-dd");

    const formTxDescriptionLower = formData.description.toLowerCase();
    const formTxCategoryLower = formData.category.toLowerCase();
    const formTxType = formData.type;

    const isActualEditOperation = editingTransaction !== null;

    if (!isActualEditOperation) {
        const similarExistingTx = transactions.find(existingTx =>
            existingTx.date === formattedDate &&
            existingTx.description.toLowerCase() === formTxDescriptionLower &&
            existingTx.category.toLowerCase() === formTxCategoryLower &&
            existingTx.type === formTxType &&
            existingTx.amount !== amountInINR
        );

        if (similarExistingTx) {
            const oldAmountInSelectedCurrency = convertAmount(similarExistingTx.amount, selectedCurrency);
            const formattedOldAmount = formatCurrency(oldAmountInSelectedCurrency, selectedCurrency);
            addNotification({
                title: "Review Transaction",
                description: `A transaction for '${formData.description}' (${formData.category}, ${formTxType}) on ${format(formData.date, "PPP")} already exists with amount ${formattedOldAmount}. If this is a correction, please edit the existing one.`,
                type: "warning",
            });
            setIsFormOpen(false);
            setIsSaving(false);
            return;
        }
    }

    const exactDuplicateTx = transactions.find(existingTx => {
        if (isActualEditOperation && existingTx.id === editingTransaction!.id) {
            return false;
        }
        return existingTx.date === formattedDate &&
               existingTx.description.toLowerCase() === formTxDescriptionLower &&
               existingTx.category.toLowerCase() === formTxCategoryLower &&
               existingTx.amount === amountInINR &&
               existingTx.type === formTxType;
    });

    if (exactDuplicateTx) {
        addNotification({
            title: "Duplicate Transaction",
            description: "An identical transaction already exists.",
            type: "error",
        });
        setIsFormOpen(false);
        setIsSaving(false);
        return;
    }

    let originalTransactionDetailsForEdit: { category: string; date: string; type: 'income' | 'expense', amount: number } | undefined = undefined;

    const dataForApi = {
        date: formattedDate,
        description: formData.description,
        category: formData.category,
        amount: amountInINR,
        type: formData.type,
    };

    try {
      let savedTransaction: Transaction;
      if (isActualEditOperation && editingTransaction) {
        originalTransactionDetailsForEdit = {
            category: editingTransaction.category,
            date: editingTransaction.date,
            type: editingTransaction.type,
            amount: editingTransaction.amount
        };
        const transactionToUpdate: Transaction = { ...dataForApi, id: editingTransaction.id };
        const response = await axios.put<Transaction>(`${TRANSACTION_API_BASE_URL}/${editingTransaction.id}?email=${encodeURIComponent(user.email)}`, transactionToUpdate);
        savedTransaction = response.data;
        updateTransaction(savedTransaction);
        addNotification({
            title: `Transaction Updated`,
            description: `${savedTransaction.description} successfully updated.`,
            type: "success",
            href: "/transactions"
        });

      } else {
        const response = await axios.post<Transaction>(`${TRANSACTION_API_BASE_URL}?email=${encodeURIComponent(user.email)}`, dataForApi);
        savedTransaction = response.data;
        addTransaction(savedTransaction);
        addNotification({
            title: `Transaction Added`,
            description: `${savedTransaction.description} successfully added.`,
            type: "success",
            href: "/transactions"
        });
      }

      setIsFormOpen(false);
      setEditingTransaction(null);

      if (isActualEditOperation && originalTransactionDetailsForEdit) {
          const oldCat = originalTransactionDetailsForEdit.category;
          const oldDate = originalTransactionDetailsForEdit.date;
          const oldType = originalTransactionDetailsForEdit.type;

          if (oldType === 'expense' &&
              (oldCat.toLowerCase() !== savedTransaction.category.toLowerCase() ||
               oldDate.substring(0,7) !== savedTransaction.date.substring(0,7) ||
               savedTransaction.type !== 'expense')) {
              refreshAffectedBudgets({ category: oldCat, date: oldDate, type: 'expense' });
          }
      }
      if (savedTransaction.type === 'expense') {
          refreshAffectedBudgets(savedTransaction);
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
          <Button onClick={handleAddTransaction} disabled={isLoadingTransactions}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Transaction
          </Button>
        </motion.div>
      </div>

      {isLoadingTransactions ? (
        <div className="flex items-center justify-center p-10">
          <RotateCw className="mr-2 h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      ) : transactions.length > 0 ? (
        <motion.div initial="initial" animate="animate" variants={tableMotionVariants} viewport={{ once: true }}>
          <DataTable columns={columns} data={transactions} />
        </motion.div>
      ) : (
        <motion.div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center"
          initial="initial"
          animate="animate"
          variants={emptyStateMotionVariants}
          viewport={{ once: true }}
        >
            <NoTransactionsIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No transactions yet</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Get started by adding your first income or expense.
            </p>
            <Button onClick={handleAddTransaction}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
        </motion.div>
      )}

      <TransactionFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transaction={editingTransaction}
        onSave={handleSaveTransaction}
        isSaving={isSaving}
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
            <AlertDialogCancel onClick={() => setTransactionToDeleteId(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
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
