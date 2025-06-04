
"use client";

import { BalanceOverviewChart } from "@/components/dashboard/balance-overview-chart";
import { ExpenseBreakdownChart } from "@/components/dashboard/expense-breakdown-chart";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { dashboardSummaryData } from "@/lib/placeholder-data";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5 }}
          className="font-headline text-3xl font-bold tracking-tight"
        >
          Dashboard
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-muted-foreground"
        >
          Welcome back! Here's your financial overview.
        </motion.p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardSummaryData.map((data, index) => (
          <SummaryCard key={data.title} data={data} index={index} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div custom={dashboardSummaryData.length} variants={cardVariants} initial="hidden" animate="visible">
          <BalanceOverviewChart />
        </motion.div>
        <motion.div custom={dashboardSummaryData.length + 1} variants={cardVariants} initial="hidden" animate="visible">
          <ExpenseBreakdownChart />
        </motion.div>
      </div>
      
      {/* Placeholder for recent transactions or upcoming bills */}
      {/* <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Placeholder for recent transactions list...</p>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
