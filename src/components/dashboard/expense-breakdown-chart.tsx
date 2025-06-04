
"use client"

import * as React from "react"
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { expenseCategoriesData } from "@/lib/placeholder-data"
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/utils";

const baseChartConfig = { // Renamed to avoid conflict in memo
  value: {
    label: "Expenses",
  },
  food: {
    label: "Food",
    color: "hsl(var(--chart-1))",
  },
  transport: {
    label: "Transport",
    color: "hsl(var(--chart-2))",
  },
  entertainment: {
    label: "Entertainment",
    color: "hsl(var(--chart-3))",
  },
  utilities: {
    label: "Utilities",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function ExpenseBreakdownChart() {
  const { selectedCurrency, convertAmount } = useCurrency();

  const chartData = React.useMemo(() => {
    return expenseCategoriesData.map(item => ({
      ...item,
      value: convertAmount(item.value, selectedCurrency), // Convert value to selected currency
    }));
  }, [selectedCurrency, convertAmount, expenseCategoriesData]); // Added expenseCategoriesData

  const chartConfig = React.useMemo(() => baseChartConfig, []);


  // totalValue calculation will now use the converted chartData
  const totalValue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData])

  return (
    <Card className="flex flex-col shadow-lg transition-shadow hover:shadow-xl h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="font-headline">Expense Breakdown</CardTitle>
        <CardDescription>Current month's expenses by category (in {selectedCurrency})</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <RechartsTooltip 
              content={
                <ChartTooltipContent 
                  nameKey="category" 
                  hideLabel 
                  formatter={(value, name) => [formatCurrency(value as number, selectedCurrency), name as string]}
                />
              } 
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
              animationDuration={800}
              animationBegin={200}
            >
              {chartData.map((entry) => (
                <Cell key={entry.category} fill={entry.fill as string} /> // Added 'as string' for fill
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
