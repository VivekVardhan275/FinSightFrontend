import type { SummaryCardData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  data: SummaryCardData;
}

export function SummaryCard({ data }: SummaryCardProps) {
  return (
    <Card className="shadow-lg transition-all hover:shadow-xl animate-in fade-in-50 zoom-in-95 duration-300">
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
  );
}
