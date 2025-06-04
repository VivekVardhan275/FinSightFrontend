
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
      return; // Only refresh budgets for expense transactions or if type is unknown (e.g., for old category after edit)
    }
    const transactionDate = new Date(transactionDetails.date); // Date string YYYY-MM-DD
    const year = transactionDate.getFullYear();
    const month = transactionDate.getMonth() + 1; // date-fns months are 0-indexed, but we use 1-indexed
    const transactionCategoryLower = transactionDetails.category.toLowerCase();

    const affectedBudgets = budgets.filter(b => {
      const budgetMonthYear = b.month.split('-'); // YYYY-MM
      return b.category.toLowerCase() === transactionCategoryLower && 
             parseInt(budgetMonthYear[0]) === year &&
             parseInt(budgetMonthYear[1]) === month;
    });
    
    affectedBudgets.forEach(budget => {
      // Pass the current global transactions list for recalculation
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
        // After deletion, the `transactions` list in context is updated.
        // We need to get the updated list to pass to updateBudgetSpentAmount.
        // However, the `transactions` variable in this scope might be stale.
        // A robust way is to filter it out from the current stale `transactions` list for immediate calculation.
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
    // transactionData.amount is already in USD from TransactionFormDialog
    // transactionData.date is "yyyy-MM-dd" string

    const isPotentialEdit = 'id' in transactionData;
    const editingTransactionIdIfEditing = isPotentialEdit ? (transactionData as Transaction).id : null;

    const formTxDate = transactionData.date;
    const formTxDescriptionLower = transactionData.description.toLowerCase();
    const formTxCategoryLower = transactionData.category.toLowerCase();
    const formTxAmountUSD = transactionData.amount; // Already in USD
    const formTxType = transactionData.type;

    // Scenario 1: Trying to ADD a new transaction that is very similar to an existing one but differs in amount
    if (!editingTransactionIdIfEditing) { // This is definitively an ADD operation
        const similarExistingTx = transactions.find(existingTx =>
            existingTx.date === formTxDate &&
            existingTx.description.toLowerCase() === formTxDescriptionLower &&
            existingTx.category.toLowerCase() === formTxCategoryLower &&
            existingTx.type === formTxType &&
            existingTx.amount !== formTxAmountUSD // Compare USD amounts
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

    // Scenario 2: Trying to ADD OR EDIT to an EXACT duplicate of another transaction
    const exactDuplicateTx = transactions.find(existingTx => {
        if (editingTransactionIdIfEditing && existingTx.id === editingTransactionIdIfEditing) {
            return false; // Don't compare with self when editing
        }
        return existingTx.date === formTxDate &&
               existingTx.description.toLowerCase() === formTxDescriptionLower &&
               existingTx.category.toLowerCase() === formTxCategoryLower &&
               existingTx.amount === formTxAmountUSD && // Both are USD
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
    
    // If we reach here, it's safe to add or update
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

    // After state updates in context, `transactions` list here will be updated in next render.
    // For immediate budget refresh, we rely on the context's `transactions` list to be up-to-date when `updateBudgetSpentAmount` is called.

    if (isActualEditOperation && originalTransactionDetailsForEdit) {
        const oldCat = originalTransactionDetailsForEdit.category;
        const oldDate = originalTransactionDetailsForEdit.date;
        const oldType = originalTransactionDetailsForEdit.type;
        const oldAmount = originalTransactionDetailsForEdit.amount;

        const newCat = savedTransaction.category;
        const newDate = savedTransaction.date;
        const newType = savedTransaction.type;
        const newAmount = savedTransaction.amount;

        // Check if the transaction moved out of an expense category/month or its expense-affecting properties changed
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
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Manage your income and expenses.</p>
        </div>
        <Button onClick={handleAddTransaction} className="animate-in fade-in duration-300">
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Transaction
        </Button>
      </div>

      <DataTable columns={columns} data={transactions} />

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

