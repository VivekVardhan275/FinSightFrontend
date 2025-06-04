
"use client"

import React from "react";
import { TrendingUp } from "lucide-react"
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
import { balanceHistory } from "@/lib/placeholder-data"
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/utils";


export function BalanceOverviewChart() {
  const { selectedCurrency, convertAmount } = useCurrency();

  const chartData = React.useMemo(() => {
    return balanceHistory.map(item => ({
      ...item,
      balance: convertAmount(item.balance, selectedCurrency), // Convert balance to selected currency
    }));
  }, [selectedCurrency, convertAmount, balanceHistory]); // Added balanceHistory to dependencies

  const chartConfig = React.useMemo(() => ({
    balance: {
      label: `Balance (${selectedCurrency})`,
      color: "hsl(var(--chart-1))",
    },
  }), [selectedCurrency]) satisfies ChartConfig;

  const yAxisTickFormatter = (value: number) => {
    // value is already converted from chartData
    const kValue = value / 1000;
    let symbol = '';
    if (selectedCurrency === 'USD') symbol = '$';
    else if (selectedCurrency === 'EUR') symbol = '€';
    else if (selectedCurrency === 'GBP') symbol = '£';
    
    return `${symbol}${kValue.toFixed(0)}k`;
  };

  return (
    <Card className="shadow-lg transition-shadow hover:shadow-xl h-full">
      <CardHeader>
        <CardTitle className="font-headline">Balance Overview</CardTitle>
        <CardDescription>Your account balance over the last 6 months (in {selectedCurrency}).</CardDescription>
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
              content={
                <ChartTooltipContent 
                  hideIndicator 
                  formatter={(value, name) => [formatCurrency(value as number, selectedCurrency), name as string]}
                />
              } 
            />
            <Line
              dataKey="balance"
              type="monotone"
              stroke="var(--color-balance)"
              strokeWidth={3}
              dot={true}
              animationDuration={800}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total balance for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
