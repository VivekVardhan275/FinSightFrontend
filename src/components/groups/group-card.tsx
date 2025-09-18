
"use client";

import type { GroupExpense } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Users } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useCurrency } from '@/contexts/currency-context';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

interface GroupCardProps {
  group: GroupExpense;
  onEdit: (group: GroupExpense) => void;
  onDelete: (groupId: string) => void;
  variants?: Variants;
  custom?: number;
}

export function GroupCard({ group, onEdit, onDelete, variants, custom }: GroupCardProps) {
  const { selectedCurrency, convertAmount } = useCurrency();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      custom={custom}
      className="h-full"
      whileHover={{ y: -5, scale: 1.03, transition: { duration: 0.2 } }}
      viewport={{ once: true }}
    >
      <Card className="shadow-lg transition-shadow hover:shadow-xl h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="font-headline text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {group.groupName}
            </CardTitle>
            <Badge variant="secondary" className="shrink-0">{group.members.length} Members</Badge>
          </div>
          <CardDescription>
            Total Expense: {formatCurrency(convertAmount(group.totalExpense, selectedCurrency), selectedCurrency)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 flex-grow">
          <h4 className="text-sm font-medium text-muted-foreground">Member Breakdown</h4>
          <ScrollArea className="h-32 pr-4">
            <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground">
                    <div className="col-span-1">Member</div>
                    <div className="col-span-1 text-right">Paid</div>
                    <div className="col-span-1 text-right">Balance</div>
                </div>
                <Separator />
                {group.members.map((member, index) => (
                    <div key={`${member}-${index}`} className="grid grid-cols-3 gap-2 items-center text-sm">
                        <span className="truncate col-span-1" title={member}>{member}</span>
                        <span className="text-right col-span-1">
                            {formatCurrency(convertAmount(group.expenses[index], selectedCurrency), selectedCurrency)}
                        </span>
                        <span className={`text-right col-span-1 font-medium ${group.balance[index] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(convertAmount(group.balance[index], selectedCurrency), selectedCurrency)}
                        </span>
                    </div>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(group)} aria-label="Edit group">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(group.id)} aria-label="Delete group" className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
