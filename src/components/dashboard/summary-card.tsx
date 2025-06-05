
"use client";

import type { SummaryCardData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useCurrency } from "@/contexts/currency-context";

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
      delay: 0.1 + i * 0.1, // Staggered delay based on index
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

export function SummaryCard({ data, index }: SummaryCardProps) {
  const { selectedCurrency, convertAmount } = useCurrency();
  const [animatedRawValue, setAnimatedRawValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, data.rawValue, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (value) => {
        setAnimatedRawValue(value);
      },
    });
    return () => controls.stop();
  }, [data.rawValue]);

  const convertedDisplayValue = data.isCurrency !== false ? convertAmount(animatedRawValue, selectedCurrency) : animatedRawValue;
  const displayValue = data.isCurrency !== false ? formatCurrency(convertedDisplayValue, selectedCurrency) : Math.round(convertedDisplayValue).toString();

  let trendColorClass = "";
  if (!data.isSimpleTrend && data.trendDirection) {
    const isExpenseCard = data.title === 'Total Expenses';
    if (isExpenseCard) {
      trendColorClass = data.trendDirection === 'up' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
    } else {
      trendColorClass = data.trendDirection === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    }
  }


  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      viewport={{ once: true }}
    >
      <Card className="shadow-lg transition-shadow hover:shadow-xl h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{data.title}</CardTitle>
          {data.icon}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-headline">
            {data.prefix || ''}{displayValue}{data.suffix || ''}
          </div>
          {data.trend && (
            data.isSimpleTrend ? (
              <p className="text-xs text-muted-foreground font-semibold">
                {data.trend}
              </p>
            ) : data.trendDirection && (
              <p className={cn(
                "text-xs text-muted-foreground flex items-center",
                trendColorClass
              )}>
                {data.trendDirection === 'up' ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                {data.trend}
              </p>
            )
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
