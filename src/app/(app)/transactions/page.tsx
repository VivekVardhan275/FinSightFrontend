
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
import { format } from 'date-fns';


export default function TransactionsPage() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction: deleteTransactionFromContext } = useTransactionContext();
  const { budgets, updateBudgetSpentAmount } = useBudgetContext();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<string | null>(null);

  const { addNotification } = useNotification();

  const refreshAffectedBudgets = (transaction: Transaction | { category: string; date: string; }) => {
    const transactionDate = new Date(transaction.date);
    const year = transactionDate.getFullYear();
    const month = transactionDate.getMonth() + 1;
    const transactionCategoryLower = transaction.category.toLowerCase();

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
      if (transactionToDelete) {
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
    const formTxDate = transactionData.date; // This is already "yyyy-MM-dd" string from dialog
    const formTxDescriptionLower = transactionData.description.toLowerCase();
    const formTxCategoryLower = transactionData.category.toLowerCase();
    const formTxAmount = transactionData.amount; // This is in USD
    const formTxType = transactionData.type;

    const isDuplicate = transactions.some(existingTx => {
      // If we are editing and existingTx is the one being edited, don't consider it a duplicate of itself.
      if ('id' in transactionData && existingTx.id === (transactionData as Transaction).id) {
        return false; 
      }
      return existingTx.date === formTxDate &&
             existingTx.description.toLowerCase() === formTxDescriptionLower &&
             existingTx.category.toLowerCase() === formTxCategoryLower &&
             existingTx.amount === formTxAmount && 
             existingTx.type === formTxType;
    });

    if (isDuplicate) {
      addNotification({
        title: "Duplicate Data",
        description: "This transaction's details match an existing transaction.",
        type: "error",
      });
      setIsFormOpen(false); 
      return; 
    }

    let isEditingOperation = false;
    let savedDescription = "";
    let savedTransaction: Transaction;
    let originalTransactionForEdit: Transaction | undefined = undefined;

    if ('id' in transactionData) {
        const existingTxFromContext = transactions.find(t => t.id === (transactionData as Transaction).id);
        if (existingTxFromContext) {
            isEditingOperation = true;
            originalTransactionForEdit = existingTxFromContext;
        }
    }
    
    if (isEditingOperation) {
      updateTransaction(transactionData as Transaction);
      savedDescription = (transactionData as Transaction).description;
      savedTransaction = transactionData as Transaction;
    } else { 
      // The ID is already added in the dialog for new transactions too.
      // So addTransaction should just take the Transaction object.
      // However, the context's addTransaction expects Omit<Transaction, 'id'>
      // Let's ensure the object passed to addTransaction doesn't have an 'id' if it's truly new
      // or let the context's addTransaction assign it.
      // For now, assuming transactionData might come with a new ID from dialog.
      // If addTransaction in context assigns ID, then we might need to adjust dialog or context.
      // The current TransactionFormDialog generates an ID if it's a new tx.
      // So, if it's not an edit, we can assume transactionData is a full Transaction object with a *new* ID.
      // The context's addTransaction should be robust to this, or we use a different pathway.

      // Let's modify the context's addTransaction to accept a full Transaction object with a pre-generated ID
      // or adjust here. For now, assume addTransaction in context handles it or generates one if not present.
      // The simplest is that `addTransaction` takes Omit<Transaction, 'id'>.
      // But our dialog creates an ID. So, we should pass the full object if the ID is indeed new.

      // If it's not an editing operation, it's an add.
      // The `addTransaction` in context expects `Omit<Transaction, 'id'>` and generates its own ID.
      // So we need to pass `transactionData` without its pre-generated ID from the form.
      const { id, ...newTxData } = transactionData as Transaction; // remove the form-generated ID for new TX
      savedTransaction = addTransaction(newTxData); // context addTransaction will assign a new ID
      savedDescription = savedTransaction.description;

    }

    addNotification({
      title: `Transaction ${isEditingOperation ? 'Updated' : 'Added'}`,
      description: `${savedDescription} successfully ${isEditingOperation ? 'updated' : 'added'}.`,
      type: "success",
      href: "/transactions"
    });
    setIsFormOpen(false); // Ensure form closes on successful save too

    const updatedTransactionsList = transactions.map(t => t.id === savedTransaction.id ? savedTransaction : t);
    
    if (isEditingOperation && originalTransactionForEdit && 
        (originalTransactionForEdit.category.toLowerCase() !== savedTransaction.category.toLowerCase() || 
         originalTransactionForEdit.date.substring(0,7) !== savedTransaction.date.substring(0,7) ||
         originalTransactionForEdit.type !== savedTransaction.type ||
         originalTransactionForEdit.amount !== savedTransaction.amount)
       ) {
      const oldTransactionDate = new Date(originalTransactionForEdit.date);
      const oldYear = oldTransactionDate.getFullYear();
      const oldMonth = oldTransactionDate.getMonth() + 1;
      const oldTransactionCategoryLower = originalTransactionForEdit.category.toLowerCase();

      const previouslyAffectedBudgets = budgets.filter(b => {
        const budgetMonthYear = b.month.split('-');
        return b.category.toLowerCase() === oldTransactionCategoryLower && 
               parseInt(budgetMonthYear[0]) === oldYear &&
               parseInt(budgetMonthYear[1]) === oldMonth;
      });
      previouslyAffectedBudgets.forEach(budget => {
        updateBudgetSpentAmount(budget.id, updatedTransactionsList);
      });
    }
    
    refreshAffectedBudgets(savedTransaction); 
  };
  
  const columns = useMemo(() => getColumns(handleEditTransaction, confirmDeleteTransaction), [transactions, budgets]); //eslint-disable-line react-hooks/exhaustive-deps


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
