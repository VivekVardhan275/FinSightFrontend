
"use client";

import type { Transaction } from "@/types";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/currency-context";
import React from "react"; // Import React for JSX

// A small component to render the amount cell, allowing use of the useCurrency hook
const AmountCellContent: React.FC<{ cell: CellContext<Transaction, unknown> }> = ({ cell }) => {
  const { selectedCurrency, convertAmount } = useCurrency();
  const amount = parseFloat(cell.row.getValue("amount")); // This is amount in USD
  const convertedAmount = convertAmount(amount, selectedCurrency);
  return <div className="text-right font-medium">{formatCurrency(convertedAmount, selectedCurrency)}</div>;
};


export const getColumns = (
  onEdit: (transaction: Transaction) => void,
  onDelete: (transactionId: string) => void
): ColumnDef<Transaction>[] => [
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => new Date(row.getValue("date")).toLocaleDateString(),
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right w-full justify-end"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: (cellContext) => <AmountCellContent cell={cellContext} />,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type: "income" | "expense" = row.getValue("type");
      return (
        <Badge variant={type === "income" ? "default" : "secondary"} 
               className={type === "income" ? "bg-green-500/20 text-green-700 dark:bg-green-700/30 dark:text-green-300 border-green-500/30" : "bg-red-500/20 text-red-700 dark:bg-red-700/30 dark:text-red-300 border-red-500/30"}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(transaction)}>
              Edit Transaction
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(transaction.id)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50"
            >
              Delete Transaction
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

