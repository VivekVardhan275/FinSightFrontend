// src/components/groups/group-card.tsx
"use client";

import type { Group } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { useCurrency } from '@/contexts/currency-context';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

interface GroupCardProps {
  group: Group;
  onEdit: (group: Group) => void;
  onDelete: (groupId: string) => void;
}

const cardMotionVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export function GroupCard({ group, onEdit, onDelete }: GroupCardProps) {
    const { selectedCurrency } = useCurrency();

  return (
    <motion.div
        variants={cardMotionVariants}
        className="h-full"
        whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
    >
        <Card className="shadow-lg transition-shadow hover:shadow-xl h-full flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-headline text-xl flex items-center">
                        <Users className="mr-3 h-6 w-6 text-primary" />
                        {group.groupName}
                    </CardTitle>
                    <Badge variant="outline">
                        {group.members.length} Member{group.members.length === 1 ? '' : 's'}
                    </Badge>
                </div>
                <CardDescription>
                    Total Expense: {formatCurrency(group.totalExpense, selectedCurrency)}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                <Separator />
                 <ScrollArea className="h-[100px] pr-3">
                    <div className="space-y-2 text-sm">
                        {group.members.map((member, index) => (
                            <div key={index} className="flex justify-between items-center">
                                <span className="text-muted-foreground truncate" title={member}>{member}</span>
                                <div className="text-right">
                                    <p className="font-medium">{formatCurrency(group.expenses[index], selectedCurrency)}</p>
                                    <p className={`text-xs ${group.balance[index] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        Bal: {formatCurrency(group.balance[index], selectedCurrency)}
                                    </p>
                                </div>
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
