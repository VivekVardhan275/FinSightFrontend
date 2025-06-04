
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DataTable } from "@/components/transactions/data-table";
import { getColumns } from "@/components/transactions/transaction-table-columns";
import { sampleTransactions } from "@/lib/placeholder-data";
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
import { v4 as uuidv4 } from 'uuid';


export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<string | null>(null);

  const { addNotification } = useNotification();


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
      setTransactions(prev => prev.filter(t => t.id !== transactionToDeleteId));
      addNotification({
        title: "Transaction Deleted",
        description: "The transaction has been successfully deleted.",
        type: "info",
      });
      setTransactionToDeleteId(null);
    }
    setIsConfirmDeleteDialogOpen(false);
  };

  const handleSaveTransaction = (transactionData: Omit<Transaction, 'id'> | Transaction) => {
    let isEditing = false;
    let savedDescription = "";

    if ('id' in transactionData && transactions.some(t => t.id === transactionData.id)) { 
      setTransactions(prev => prev.map(t => t.id === transactionData.id ? transactionData as Transaction : t));
      isEditing = true;
      savedDescription = (transactionData as Transaction).description;
    } else { 
      const newTransaction: Transaction = { ...(transactionData as Omit<Transaction, 'id'>), id: (transactionData as {id: string}).id || uuidv4() };
      setTransactions(prev => [newTransaction, ...prev]);
      savedDescription = newTransaction.description;
    }

    addNotification({
      title: `Transaction ${isEditing ? 'Updated' : 'Added'}`,
      description: `${savedDescription} successfully ${isEditing ? 'updated' : 'added'}.`,
      type: "success",
      href: "/transactions"
    });
  };

  const columns = useMemo(() => getColumns(handleEditTransaction, confirmDeleteTransaction), [handleEditTransaction, confirmDeleteTransaction]);

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
