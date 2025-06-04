
"use client"

import React, { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip as RechartsTooltip, ReferenceLine } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useCurrency } from "@/contexts/currency-context";
import { useTransactionContext } from "@/contexts/transaction-context";
import { formatCurrency } from "@/lib/utils";

export function NetSavingsOverviewChart() {
  const { selectedCurrency, convertAmount } = useCurrency();
  const { transactions } = useTransactionContext();

  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) { // Last 6 months including current
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth(); // 0-indexed

      const monthlyIncome = transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.type === 'income' &&
                 transactionDate.getFullYear() === year &&
                 transactionDate.getMonth() === month;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyExpenses = transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.type === 'expense' &&
                 transactionDate.getFullYear() === year &&
                 transactionDate.getMonth() === month;
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      const netSavingsUSD = monthlyIncome - monthlyExpenses;

      data.push({
        month: targetDate.toLocaleString('default', { month: 'short' }), // e.g., "Jul"
        netSavings: convertAmount(netSavingsUSD, selectedCurrency), // Convert final sum for display
      });
    }
    return data;
  }, [transactions, selectedCurrency, convertAmount]);

  const chartConfig = React.useMemo(() => ({
    netSavings: {
      label: `Net Savings (${selectedCurrency})`,
      color: "hsl(var(--chart-4))", 
    },
  }), [selectedCurrency]) satisfies ChartConfig;

  const yAxisTickFormatter = (value: number) => {
    if (value === 0) return formatCurrency(0, selectedCurrency).replace(/\d/g, '').replace('.00','').trim() + '0'; // Handle 0 to show currency symbol + 0
    
    const absValue = Math.abs(value);
    let displayValue: string;
    let suffix = '';

    if (absValue >= 1000000) {
        displayValue = (value / 1000000).toFixed(1);
        suffix = 'M';
    } else if (absValue >= 1000) {
        displayValue = (value / 1000).toFixed(0); // No decimal for k
        suffix = 'k';
    } else {
        displayValue = value.toFixed(0); // No decimal for values < 1k
    }
    
    const currencySymbol = formatCurrency(0, selectedCurrency).replace(/\d/g, '').replace('.', '').trim(); // Extracts currency symbol
    return `${currencySymbol}${displayValue}${suffix}`;
  };

  const previousMonthSavings = chartData.length > 1 ? chartData[chartData.length - 2]?.netSavings : 0;
  const currentMonthSavings = chartData.length > 0 ? chartData[chartData.length - 1]?.netSavings : 0;
  
  let trendPercentage = 0;
  if (previousMonthSavings !== 0) {
    trendPercentage = ((currentMonthSavings - previousMonthSavings) / Math.abs(previousMonthSavings)) * 100;
  } else if (currentMonthSavings !== 0) {
    trendPercentage = 100; // If previous was 0 and current is not, it's a 100% increase (or decrease if current is negative)
  }
  
  const trendDirection = currentMonthSavings >= previousMonthSavings ? 'up' : 'down';


  return (
    <Card className="shadow-lg transition-shadow hover:shadow-xl h-full">
      <CardHeader>
        <CardTitle className="font-headline">Net Savings Overview</CardTitle>
        <CardDescription>Your net savings over the last 6 months (in {selectedCurrency}).</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={yAxisTickFormatter}
              domain={['auto', 'auto']} 
              width={80}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <RechartsTooltip 
              cursor={false}
              content={
                <ChartTooltipContent 
                  formatter={(value) => formatCurrency(value as number, selectedCurrency)}
                />
              } 
            />
            <Line
              dataKey="netSavings"
              type="monotone"
              stroke="var(--color-netSavings)"
              strokeWidth={3}
              dot={true}
              animationDuration={800}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {chartData.length > 1 && ( // Only show trend if there's enough data
            <>
              {trendDirection === 'up' ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
              Trending {trendDirection} by {Math.abs(trendPercentage).toFixed(1)}% this period
            </>
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing net savings for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
