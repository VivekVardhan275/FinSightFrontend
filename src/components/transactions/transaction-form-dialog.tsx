
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Transaction, TransactionFormData } from "@/types";
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, RotateCw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useCurrency } from "@/contexts/currency-context";

interface TransactionFormDialogProps {
  transaction?: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TransactionFormData) => void; 
  isSaving?: boolean;
}

const getTransactionSchema = (selectedCurrency: string) => z.object({
  date: z.date({ required_error: "Date is required." }),
  description: z.string().min(1, "Description is required."),
  category: z.string().min(1, "Category is required."),
  amount: z.number().positive(`Amount in ${selectedCurrency} must be positive.`),
  type: z.enum(["income", "expense"], { required_error: "Type is required." }),
});


export function TransactionFormDialog({
  transaction,
  open,
  onOpenChange,
  onSave,
  isSaving = false,
}: TransactionFormDialogProps) {
  const { selectedCurrency, convertAmount } = useCurrency();

  const transactionSchema = getTransactionSchema(selectedCurrency);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date(),
      description: "",
      category: "",
      amount: 0, // This amount is in selectedCurrency for the form
      type: "expense",
    },
  });

  useEffect(() => {
    if (open) {
      if (transaction) {
        // When editing, transaction.amount from backend is in INR.
        // Convert it to selectedCurrency for display in the form.
        const displayAmount = convertAmount(transaction.amount, selectedCurrency);
        reset({
          date: parseISO(transaction.date),
          description: transaction.description,
          category: transaction.category,
          amount: parseFloat(displayAmount.toFixed(2)), // Amount is in selectedCurrency for the form
          type: transaction.type,
        });
      } else {
        reset({
          date: new Date(),
          description: "",
          category: "",
          amount: 0, // Amount is in selectedCurrency for the form
          type: "expense",
        });
      }
    }
  }, [transaction, open, reset, selectedCurrency, convertAmount]);

  // Passes validated form data (amounts in selectedCurrency) to the parent.
  // Parent component (TransactionsPage) will handle INR conversion for API calls.
  const processSubmit = (data: TransactionFormData) => {
    onSave(data);
  };
  
  const finalIsSaving = isSaving || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={!finalIsSaving ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <DialogHeader>
            <DialogTitle className="font-headline">
              {transaction ? "Edit Transaction" : "Add New Transaction"}
            </DialogTitle>
            <DialogDescription>
              {transaction
                ? "Update the details of your transaction."
                : "Enter the details for your new transaction."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Date</Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={finalIsSaving}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={finalIsSaving}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && <p className="col-span-4 text-sm text-destructive text-right">{errors.date.message}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input
                id="description"
                {...register("description")}
                className="col-span-3"
                disabled={finalIsSaving}
              />
              {errors.description && <p className="col-span-4 text-sm text-destructive text-right">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Amount ({selectedCurrency})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount", {
                  valueAsNumber: true,
                  onChange: (e) => setValue("amount", parseFloat(parseFloat(e.target.value).toFixed(2)))
                })}
                className="col-span-3"
                disabled={finalIsSaving}
              />
              {errors.amount && <p className="col-span-4 text-sm text-destructive text-right">{errors.amount.message}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <Input
                id="category"
                {...register("category")}
                className="col-span-3"
                disabled={finalIsSaving}
              />
              {errors.category && <p className="col-span-4 text-sm text-destructive text-right">{errors.category.message}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={finalIsSaving}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="col-span-4 text-sm text-destructive text-right">{errors.type.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={finalIsSaving}>Cancel</Button>
              <Button type="submit" disabled={finalIsSaving}>
                {finalIsSaving && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
                {finalIsSaving ? "Saving..." : "Save Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
