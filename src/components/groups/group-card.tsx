
"use client";

import type { GroupExpense } from '@/types';
import { motion, type Variants } from 'framer-motion';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Icons
import { Edit2, Trash2, Users, AlertTriangle } from 'lucide-react';

// Contexts & Utilities
import { useCurrency } from '@/contexts/currency-context';
import { formatCurrency } from '@/lib/utils';

interface GroupCardProps {
  group: GroupExpense;
  onEdit: (group: GroupExpense) => void;
  onDelete: (groupId: string) => void;
  variants?: Variants;
  custom?: number;
}

export function GroupCard({ group, onEdit, onDelete, variants, custom }: GroupCardProps) {
  const { selectedCurrency, convertAmount } = useCurrency();
  const currencyContext = useCurrency();

  const safeConvertAmount = (amount: number) => {
    if (!currencyContext) return amount;
    return convertAmount(amount);
  };
  const safeSelectedCurrency = currencyContext?.selectedCurrency || 'INR';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      custom={custom}
      className="h-full"
      whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
      viewport={{ once: true }}
    >
      <Card className="shadow-lg transition-shadow hover:shadow-xl h-full flex flex-col border-border/60">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="truncate" title={group.groupName}>{group.groupName}</span>
            </CardTitle>
            <Badge variant="secondary" className="shrink-0">{group.members?.length || 0} Members</Badge>
          </div>
          <CardDescription>
            Total Expense: {formatCurrency(safeConvertAmount(group.totalExpense), safeSelectedCurrency)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 flex-grow">
          <h4 className="text-sm font-medium text-muted-foreground">Member Expenses</h4>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-muted-foreground">
              <div>Member</div>
              <div className="text-right">Amount Paid</div>
            </div>
            <Separator />
            <ScrollArea className="h-28 pr-4">
              {group.members && group.expenses && group.members.length === group.expenses.length ? (
                 group.members.length > 0 ? (
                    group.members.map((member, index) => (
                        <div key={`${group.id}-member-${index}`} className="grid grid-cols-2 gap-2 items-center text-sm py-1.5">
                            <span className="truncate" title={member}>{member}</span>
                            <span className="text-right text-muted-foreground">
                            {formatCurrency(safeConvertAmount(group.expenses?.[index] ?? 0), safeSelectedCurrency)}
                            </span>
                        </div>
                    ))
                 ) : (
                    <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                        <p>No members in this group.</p>
                    </div>
                 )
              ) : (
                <div className="flex items-center justify-center h-24 text-sm text-destructive gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <p>Group data is inconsistent.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2 pt-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onEdit(group)} aria-label="Edit group">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Group</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onDelete(group.id ?? '')} aria-label="Delete group" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Group</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
