
"use client"

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
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
import { incomeHistory } from "@/lib/placeholder-data"
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/utils";

export function IncomeOverviewChart() {
  const { selectedCurrency, convertAmount } = useCurrency();

  const chartData = React.useMemo(() => {
    return incomeHistory.map(item => ({
      ...item,
      income: convertAmount(item.income, selectedCurrency),
    }));
  }, [selectedCurrency, convertAmount]);

  const chartConfig = React.useMemo(() => ({
    income: {
      label: `Income (${selectedCurrency})`,
      color: "hsl(var(--chart-2))", // Using chart-2 color
    },
  }), [selectedCurrency]) satisfies ChartConfig;

  const yAxisTickFormatter = (value: number) => {
    const kValue = value / 1000;
    let symbol = '';
    if (selectedCurrency === 'USD') symbol = '$';
    else if (selectedCurrency === 'EUR') symbol = '€';
    else if (selectedCurrency === 'GBP') symbol = '£';
    else if (selectedCurrency === 'INR') symbol = '₹';
    
    return `${symbol}${kValue.toFixed(0)}k`;
  };

  // Placeholder trend calculation (replace with actual logic if needed)
  const previousMonthIncome = chartData.length > 1 ? chartData[chartData.length - 2]?.income : 0;
  const currentMonthIncome = chartData.length > 0 ? chartData[chartData.length - 1]?.income : 0;
  const trendPercentage = previousMonthIncome ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100 : 0;
  const trendDirection = trendPercentage >= 0 ? 'up' : 'down';

  return (
    <Card className="shadow-lg transition-shadow hover:shadow-xl h-full">
      <CardHeader>
        <CardTitle className="font-headline">Income Overview</CardTitle>
        <CardDescription>Your total income over the last 6 months (in {selectedCurrency}).</CardDescription>
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
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={yAxisTickFormatter}
            />
            <RechartsTooltip 
              cursor={false}
              content={
                <ChartTooltipContent 
                  formatter={(value) => formatCurrency(value as number, selectedCurrency)}
                />
              } 
            />
            <Line
              dataKey="income"
              type="monotone"
              stroke="var(--color-income)"
              strokeWidth={3}
              dot={true}
              animationDuration={800}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {trendDirection === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          Trending {trendDirection} by {Math.abs(trendPercentage).toFixed(1)}% this period
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total income for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
