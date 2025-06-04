
"use client";

import type { SummaryCardData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SummaryCardProps {
  data: SummaryCardData;
  index: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

export function SummaryCard({ data, index }: SummaryCardProps) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="shadow-lg transition-shadow hover:shadow-xl h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{data.title}</CardTitle>
          {data.icon}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-headline">{data.value}</div>
          {data.trend && (
            <p className={cn(
              "text-xs text-muted-foreground flex items-center",
              data.trendDirection === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {data.trendDirection === 'up' ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
              {data.trend}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
