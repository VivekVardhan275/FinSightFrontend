import { BalanceOverviewChart } from "@/components/dashboard/balance-overview-chart";
import { ExpenseBreakdownChart } from "@/components/dashboard/expense-breakdown-chart";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { dashboardSummaryData } from "@/lib/placeholder-data";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardSummaryData.map((data) => (
          <SummaryCard key={data.title} data={data} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BalanceOverviewChart />
        <ExpenseBreakdownChart />
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
