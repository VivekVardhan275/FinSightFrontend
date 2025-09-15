// src/app/(app)/groups/[groupId]/page.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Scale, List, User } from "lucide-react";
import { motion } from "framer-motion";
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GroupExpenseFormDialog } from '@/components/groups/group-expense-form-dialog';
import type { GroupExpenseFormData, GroupMember } from '@/types';
import { format } from 'date-fns';

// Mock data - replace with API calls in a real scenario
const mockGroupDetails = {
  name: 'Trip to Mountains',
  members: [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' },
  ],
  balances: [
    { from: 'Bob', to: 'Alice', amount: 15.50 },
    { from: 'Charlie', to: 'Alice', amount: 25.00 },
  ],
  expenses: [
    { id: 'e1', description: 'Gas', amount: 50.00, paidBy: 'Alice', date: '2024-07-20' },
    { id: 'e2', description: 'Groceries', amount: 75.00, paidBy: 'Alice', date: '2024-07-21' },
    { id: 'e3', description: 'Snacks', amount: 21.50, paidBy: 'Bob', date: '2024-07-22' },
  ]
};

const getInitials = (name: string) => {
    if (!name) return "?";
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
};

const pageHeaderBlockMotionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const cardMotionVariants = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay } },
});

export default function GroupDetailPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const [isFormOpen, setIsFormOpen] = useState(false);

  // In a real app, you would fetch group details using the groupId
  // const [groupDetails, setGroupDetails] = useState(null);
  // useEffect(() => { ... fetch data ... }, [groupId]);
  const groupDetails = mockGroupDetails;

  const handleSaveExpense = (data: GroupExpenseFormData) => {
    console.log("Saving new group expense:", data);
    // Here you would post the data to POST /api/groups/{groupId}/expenses
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-8">
      <motion.div
        variants={pageHeaderBlockMotionVariants}
        initial="initial"
        animate="animate"
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              {groupDetails.name}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span>{groupDetails.members.map(m => m.name).join(', ')}</span>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Expense
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Balances Card */}
        <motion.div
          variants={cardMotionVariants(0.1)}
          initial="initial"
          animate="animate"
          viewport={{ once: true }}
          className="lg:col-span-1"
        >
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="flex items-center"><Scale className="mr-2 h-6 w-6 text-primary" /> Balances</CardTitle>
              <CardDescription>Summary of who owes whom.</CardDescription>
            </CardHeader>
            <CardContent>
              {groupDetails.balances.length > 0 ? (
                <ul className="space-y-3">
                  {groupDetails.balances.map((balance, index) => (
                    <li key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span><strong>{balance.from}</strong> owes <strong>{balance.to}</strong></span>
                      </div>
                      <span className="font-semibold text-primary">${balance.amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">All settled up!</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expenses Card */}
        <motion.div
          variants={cardMotionVariants(0.2)}
          initial="initial"
          animate="animate"
          viewport={{ once: true }}
          className="lg:col-span-2"
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><List className="mr-2 h-6 w-6 text-primary" /> Expenses</CardTitle>
              <CardDescription>All expenses for this group.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Paid By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupDetails.expenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.paidBy}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(expense.date), "PP")}</TableCell>
                      <TableCell className="text-right font-medium">${expense.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <GroupExpenseFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveExpense}
        members={groupDetails.members}
      />
    </div>
  );
}
