
"use client";

import type { Budget } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, type Variants } from 'framer-motion';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
  variants?: Variants;
}

export function BudgetCard({ budget, onEdit, onDelete, variants }: BudgetCardProps) {
  const progress = Math.min((budget.spent / budget.allocated) * 100, 100);
  const remaining = budget.allocated - budget.spent;
  const isOverBudget = budget.spent > budget.allocated;

  return (
    <motion.div 
      variants={variants} 
      className="h-full"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="shadow-lg transition-shadow hover:shadow-xl h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-xl">{budget.category}</CardTitle>
            {isOverBudget && <AlertTriangle className="h-5 w-5 text-destructive" />}
          </div>
          <CardDescription>
            Month: {new Date(budget.month + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 flex-grow">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>Spent: {formatCurrency(budget.spent)}</span>
              <span className="text-muted-foreground">Allocated: {formatCurrency(budget.allocated)}</span>
            </div>
            <Progress value={progress} className="h-3 [&>*]:bg-[--progress-bar-color]" style={{ '--progress-bar-color': `var(--${isOverBudget ? 'destructive' : progress > 90 ? 'destructive' : progress > 70 ? 'yellow-500' : 'primary'})` } as React.CSSProperties} />
          </div>
          <p className={cn(
            "text-sm font-medium",
            isOverBudget ? "text-destructive" : remaining >=0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
          )}>
            {isOverBudget 
              ? `Over budget by ${formatCurrency(Math.abs(remaining))}` 
              : `${formatCurrency(remaining)} Remaining`}
          </p>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(budget)} aria-label="Edit budget">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(budget.id)} aria-label="Delete budget" className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
