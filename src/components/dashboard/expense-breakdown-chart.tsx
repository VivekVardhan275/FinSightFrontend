
"use client"

import * as React from "react"
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts"
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
import type { Transaction } from "@/types";

// Define a list of chart colors to cycle through
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ExpenseBreakdownChart() {
  const { selectedCurrency, convertAmount } = useCurrency();
  const { transactions } = useTransactionContext();

  const chartData = React.useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const currentMonthExpenses = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' &&
             transactionDate.getFullYear() === currentYear &&
             transactionDate.getMonth() === currentMonth;
    });

    const expensesByCategory: { [key: string]: { totalUsdAmount: number; displayCategory: string } } = {};
    currentMonthExpenses.forEach(t => {
      const categoryKey = t.category.toLowerCase();
      if (!expensesByCategory[categoryKey]) {
        // Store the first encountered casing for display
        expensesByCategory[categoryKey] = { totalUsdAmount: 0, displayCategory: t.category };
      }
      expensesByCategory[categoryKey].totalUsdAmount += t.amount; // Sum USD amounts
    });

    return Object.values(expensesByCategory).map((data, index) => ({
      category: data.displayCategory, // Use original casing for display
      value: convertAmount(data.totalUsdAmount, selectedCurrency), // Convert final sum for display
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [transactions, selectedCurrency, convertAmount]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: `Expenses (${selectedCurrency})`,
      },
    };
    chartData.forEach(item => {
      // Use the display category for the label, but a consistent key (lowercase) for config lookup
      config[item.category.toLowerCase().replace(/\s+/g, '')] = { 
        label: item.category, // This is the display category with original casing
        color: item.fill,
      };
    });
    return config;
  }, [chartData, selectedCurrency]);


  const totalValue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData])

  return (
    <Card className="flex flex-col shadow-lg transition-shadow hover:shadow-xl h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="font-headline">Expense Breakdown</CardTitle>
        <CardDescription>Current month's expenses by category (in {selectedCurrency})</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex items-center justify-center">
        {chartData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px] w-full"
          >
            <PieChart>
              <RechartsTooltip
                content={
                  <ChartTooltipContent
                    nameKey="category" 
                    hideLabel={false} 
                    formatter={(value) => formatCurrency(value as number, selectedCurrency)}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="category" // This refers to item.category (displayCategory)
                innerRadius={60}
                strokeWidth={5}
                animationDuration={800}
                animationBegin={200}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.category} fill={entry.fill as string} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 mb-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <p>No expense data for the current month.</p>
          </div>
        )}
      </CardContent>
      {chartData.length > 0 && (
        <CardFooter className="flex-col items-start px-6 pb-6 pt-4 border-t text-sm">
          <h3 className="text-xs font-medium uppercase text-muted-foreground mb-2">Category Breakdown</h3>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
            {chartData.map((entry) => (
              <div key={entry.category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span
                    className="mr-2 h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.fill as string }}
                  />
                  <span className="text-muted-foreground truncate" title={entry.category}>
                    {entry.category} 
                  </span>
                </div>
                <span className="font-semibold ml-3 whitespace-nowrap">
                  {formatCurrency(entry.value, selectedCurrency)}
                </span>
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
