
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
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

const pageHeaderBlockMotionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const buttonMotionVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.2 } },
};

const tableMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.25 } },
};


export default function TransactionsPage() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction: deleteTransactionFromContext } = useTransactionContext();
  const { budgets, updateBudgetSpentAmount } = useBudgetContext();
  const { selectedCurrency, convertAmount } = useCurrency();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<string | null>(null);

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

  const handleDeleteTransaction = () => {
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

        const transactionDate = new Date(transactionToDelete.date);
        const year = transactionDate.getFullYear();
        const month = transactionDate.getMonth() + 1;
        const transactionCategoryLower = transactionToDelete.category.toLowerCase();

        const affectedBudgets = budgets.filter(b => {
          const budgetMonthYear = b.month.split('-');
          return b.category.toLowerCase() === transactionCategoryLower &&
                 parseInt(budgetMonthYear[0]) === year &&
                 parseInt(budgetMonthYear[1]) === month;
        });

        affectedBudgets.forEach(budget => {
          updateBudgetSpentAmount(budget.id, remainingTransactions);
        });
      }
      setTransactionToDeleteId(null);
    }
    setIsConfirmDeleteDialogOpen(false);
  };

  const handleSaveTransaction = (transactionData: Omit<Transaction, 'id'> | Transaction) => {
    const isPotentialEdit = 'id' in transactionData;
    const editingTransactionIdIfEditing = isPotentialEdit ? (transactionData as Transaction).id : null;

    const formTxDate = transactionData.date;
    const formTxDescriptionLower = transactionData.description.toLowerCase();
    const formTxCategoryLower = transactionData.category.toLowerCase();
    const formTxAmountUSD = transactionData.amount;
    const formTxType = transactionData.type;

    if (!editingTransactionIdIfEditing) {
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
                description: `A transaction for '${transactionData.description}' (${transactionData.category}, ${formTxType}) on ${format(parseISO(formTxDate), "PPP")} already exists with amount ${formattedOldAmount}. If this is a correction, please edit the existing one. To add as new, consider altering the description.`,
                type: "warning",
            });
            setIsFormOpen(false);
            return;
        }
    }

    const exactDuplicateTx = transactions.find(existingTx => {
        if (editingTransactionIdIfEditing && existingTx.id === editingTransactionIdIfEditing) {
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
        return;
    }

    let savedDescription = "";
    let savedTransaction: Transaction;
    let originalTransactionDetailsForEdit: { category: string; date: string; type: 'income' | 'expense', amount: number } | undefined = undefined;

    const isActualEditOperation = editingTransactionIdIfEditing && transactions.some(t => t.id === editingTransactionIdIfEditing);

    if (isActualEditOperation) {
        const txToUpdate = transactionData as Transaction;
        const originalTx = transactions.find(t => t.id === txToUpdate.id);
        if (originalTx) {
            originalTransactionDetailsForEdit = { category: originalTx.category, date: originalTx.date, type: originalTx.type, amount: originalTx.amount };
        }
        updateTransaction(txToUpdate);
        savedTransaction = txToUpdate;
        savedDescription = txToUpdate.description;
        addNotification({
            title: `Transaction Updated`,
            description: `${savedDescription} successfully updated.`,
            type: "success",
            href: "/transactions"
        });
    } else {
        const { id, ...newTxDataNoId } = transactionData as Transaction;
        savedTransaction = addTransaction(newTxDataNoId);
        savedDescription = savedTransaction.description;
        addNotification({
            title: `Transaction Added`,
            description: `${savedDescription} successfully added.`,
            type: "success",
            href: "/transactions"
        });
    }

    setIsFormOpen(false);

    if (isActualEditOperation && originalTransactionDetailsForEdit) {
        const oldCat = originalTransactionDetailsForEdit.category;
        const oldDate = originalTransactionDetailsForEdit.date;
        const oldType = originalTransactionDetailsForEdit.type;
        const oldAmount = originalTransactionDetailsForEdit.amount;

        const newCat = savedTransaction.category;
        const newDate = savedTransaction.date;
        const newType = savedTransaction.type;
        const newAmount = savedTransaction.amount;

        if (oldType === 'expense' &&
            (oldCat.toLowerCase() !== newCat.toLowerCase() ||
             oldDate.substring(0,7) !== newDate.substring(0,7) ||
             newType !== 'expense' ||
             oldAmount !== newAmount )) {
            refreshAffectedBudgets({ category: oldCat, date: oldDate, type: 'expense' });
        }
    }

    if (savedTransaction.type === 'expense') {
        refreshAffectedBudgets(savedTransaction);
    }
  };

  const columns = useMemo(() => getColumns(handleEditTransaction, confirmDeleteTransaction), [transactions, budgets, selectedCurrency, convertAmount]); //eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <motion.div initial="initial" animate="animate" variants={pageHeaderBlockMotionVariants} viewport={{ once: true }}>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Manage your income and expenses.</p>
        </motion.div>
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
        onSave={handleSaveTransaction}
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
