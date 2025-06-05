
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText as ReportsIcon, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const pageHeaderMotionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

const contentMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
};

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0,7)); // Default to current month YYYY-MM
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const { toast } = useToast();

  const handleGenerateReport = () => {
    toast({
      title: "Generating Report",
      description: `Your ${selectedFormat.toUpperCase()} report for ${selectedMonth} is being generated.`,
    });
    // Simulate report generation
    setTimeout(() => {
      toast({
        title: "Report Ready!",
        description: `Report for ${selectedMonth} (${selectedFormat.toUpperCase()}) is ready for download.`,
        action: <Button onClick={() => alert('Download initiated!')}><Download className="mr-2 h-4 w-4" />Download</Button>,
      });
    }, 3000);
  };

  // Create a list of months for the select dropdown (e.g., last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });


  return (
    <div className="space-y-8">
      <motion.div
        initial="initial"
        animate="animate"
        variants={pageHeaderMotionVariants}
        viewport={{ once: true }}
      >
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Generate Reports
        </h1>
        <p className="text-muted-foreground">
          Download monthly summaries of your financial activity.
        </p>
      </motion.div>

      <motion.div
        className="grid gap-6 md:grid-cols-2"
        initial="initial"
        animate="animate"
        variants={contentMotionVariants}
        viewport={{ once: true }}
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>New Report</CardTitle>
            <CardDescription>
              Select month and format to generate a new report.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="month-select" className="text-sm font-medium mb-1 block">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month-select">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(month => (
                    <SelectItem key={month} value={month}>
                      {new Date(month + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="format-select" className="text-sm font-medium mb-1 block">Format</label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger id="format-select">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateReport} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Previous Reports</CardTitle>
            <CardDescription>
              Access your previously generated reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[200px]">
            <ReportsIcon className="mx-auto h-12 w-12 text-primary/70" />
            <h3 className="mt-4 text-xl font-semibold">No Reports Yet</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Generate a report to see it listed here.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
