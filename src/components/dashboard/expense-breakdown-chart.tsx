
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
import { expenseCategoriesData } from "@/lib/placeholder-data"
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/utils";

const baseChartConfig = { 
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
      value: convertAmount(item.value, selectedCurrency), 
    }));
  }, [selectedCurrency, convertAmount, expenseCategoriesData]); 

  const chartConfig = React.useMemo(() => baseChartConfig, []);


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
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] w-full" 
        >
          <PieChart>
            <RechartsTooltip
              content={
                <ChartTooltipContent
                  nameKey="category"
                  hideLabel
                  formatter={(value, name) => `${formatCurrency(value as number, selectedCurrency)} ${name as string}`}
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
                <Cell key={entry.category} fill={entry.fill as string} /> 
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
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
                  {chartConfig[entry.category.toLowerCase() as keyof typeof chartConfig]?.label || entry.category}
                </span>
              </div>
              <span className="font-semibold ml-3 whitespace-nowrap">
                {formatCurrency(entry.value, selectedCurrency)}
              </span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}

