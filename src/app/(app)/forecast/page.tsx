
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart as ChartIcon } from "lucide-react";
import { motion } from "framer-motion";

// Removed pageHeaderBlockMotionVariants

const contentMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
};

export default function ForecastPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Financial Forecast
        </h1>
        <p className="text-muted-foreground">
          View your projected income, expenses, and net balance.
        </p>
      </div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={contentMotionVariants}
        viewport={{ once: true }}
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Future Projections</CardTitle>
            <CardDescription>
              This is where your financial forecast charts will be displayed.
              Connect to the ML microservice to see predictions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
            <ChartIcon className="mx-auto h-16 w-16 text-primary/70" />
            <h3 className="mt-6 text-xl font-semibold">Forecast Data Unavailable</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Forecasting feature is under development. Check back soon!
            </p>
            {/* Placeholder for future chart */}
            <div className="w-full h-64 bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Forecast Chart Area</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
