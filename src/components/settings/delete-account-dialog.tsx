
"use client";

import React, { useState, useEffect } from 'react';
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCw, ShieldAlert } from "lucide-react";
import { motion } from 'framer-motion';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmationCodeToMatch: string;
  onConfirmDelete: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  confirmationCodeToMatch,
  onConfirmDelete,
  isDeleting,
}: DeleteAccountDialogProps) {
  const [enteredCode, setEnteredCode] = useState("");

  useEffect(() => {
    if (open) {
      setEnteredCode(""); // Reset entered code when dialog opens
    }
  }, [open]);

  const codesMatch = enteredCode === confirmationCodeToMatch;

  const handleSubmit = async () => {
    if (codesMatch) {
      await onConfirmDelete();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={isDeleting ? undefined : onOpenChange}>
      <AlertDialogContent className="overflow-hidden">
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
        <AlertDialogHeader className="text-center sm:text-left">
          <div className="flex justify-center sm:justify-start mb-2">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <AlertDialogTitle className="font-headline text-xl">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is irreversible and will permanently delete your account and all associated data.
            To confirm, please type the following code:{" "}
            <strong className="text-foreground font-mono tracking-wider bg-muted px-1.5 py-0.5 rounded-md">
              {confirmationCodeToMatch}
            </strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="confirmationCode" className="text-sm font-medium">
            Enter Confirmation Code
          </Label>
          <Input
            id="confirmationCode"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value)}
            placeholder="Type the code here"
            disabled={isDeleting}
            className="font-mono tracking-wider"
            autoFocus
          />
          {!codesMatch && enteredCode.length > 0 && (
            <p className="text-xs text-destructive">The entered code does not match.</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={!codesMatch || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Deleting Account..." : "Confirm & Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    