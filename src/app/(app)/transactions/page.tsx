
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

    const affectedBudgets = budgets.filter(b => {
      const budgetMonthYear = b.month.split('-');
      return b.category === transaction.category && 
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
        refreshAffectedBudgets(transactionToDelete);
      }
      setTransactionToDeleteId(null);
    }
    setIsConfirmDeleteDialogOpen(false);
  };

  const handleSaveTransaction = (transactionData: Omit<Transaction, 'id'> | Transaction) => {
    let isEditing = false;
    let savedDescription = "";
    let savedTransaction: Transaction;

    if ('id' in transactionData && transactions.some(t => t.id === transactionData.id)) { 
      updateTransaction(transactionData as Transaction);
      isEditing = true;
      savedDescription = (transactionData as Transaction).description;
      savedTransaction = transactionData as Transaction;
    } else { 
      savedTransaction = addTransaction(transactionData as Omit<Transaction, 'id'>);
      savedDescription = savedTransaction.description;
    }

    addNotification({
      title: `Transaction ${isEditing ? 'Updated' : 'Added'}`,
      description: `${savedDescription} successfully ${isEditing ? 'updated' : 'added'}.`,
      type: "success",
      href: "/transactions"
    });
    refreshAffectedBudgets(savedTransaction);
  };
  
  // Effect to update budget spent amounts if transactions list changes globally
  // (e.g. due to localStorage sync or another tab)
  useEffect(() => {
    budgets.forEach(budget => {
        updateBudgetSpentAmount(budget.id, transactions);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, budgets]); // updateBudgetSpentAmount is stable

  const columns = useMemo(() => getColumns(handleEditTransaction, confirmDeleteTransaction), [transactions]);


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
