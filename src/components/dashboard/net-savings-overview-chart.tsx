
"use client"

import React from "react";
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
import { netSavingsHistory } from "@/lib/placeholder-data"
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/utils";

export function NetSavingsOverviewChart() {
  const { selectedCurrency, convertAmount } = useCurrency();

  const chartData = React.useMemo(() => {
    return netSavingsHistory.map(item => ({
      ...item,
      netSavings: convertAmount(item.netSavings, selectedCurrency),
    }));
  }, [selectedCurrency, convertAmount]);

  const chartConfig = React.useMemo(() => ({
    netSavings: {
      label: `Net Savings (${selectedCurrency})`,
      color: "hsl(var(--chart-4))", // Using chart-4 color
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

  const previousMonthSavings = chartData.length > 1 ? chartData[chartData.length - 2]?.netSavings : 0;
  const currentMonthSavings = chartData.length > 0 ? chartData[chartData.length - 1]?.netSavings : 0;
  const trendPercentage = previousMonthSavings ? ((currentMonthSavings - previousMonthSavings) / Math.abs(previousMonthSavings)) * 100 : (currentMonthSavings !== 0 ? 100 : 0) ;
  const trendDirection = trendPercentage >= 0 ? 'up' : 'down';

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
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={yAxisTickFormatter}
              domain={['auto', 'auto']} // Allow negative values
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <RechartsTooltip 
              content={
                <ChartTooltipContent 
                  hideIndicator 
                  formatter={(value, name) => [formatCurrency(value as number, selectedCurrency), name as string]}
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
           {trendDirection === 'up' ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          Trending {trendDirection} by {Math.abs(trendPercentage).toFixed(1)}% this period
        </div>
        <div className="leading-none text-muted-foreground">
          Showing net savings for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
