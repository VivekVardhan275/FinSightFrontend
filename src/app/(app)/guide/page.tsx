
"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpenText, LayoutDashboard, ListChecks, Target, LineChart as ForecastIcon, UserCircle, Settings, Bell } from "lucide-react";
import { motion } from "framer-motion";

const pageHeaderBlockMotionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const contentMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.15 } },
};

const instructionSectionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.2 + i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

interface InstructionItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const InstructionItem: React.FC<InstructionItemProps> = ({ icon, title, description, index }) => (
  <motion.div
    custom={index}
    variants={instructionSectionVariants}
    initial="hidden"
    animate="visible"
    className="mb-6 p-4 rounded-lg border bg-card/50 shadow-sm"
  >
    <div className="flex items-center mb-2">
      <div className="mr-3 text-primary">{icon}</div>
      <h3 className="text-lg font-semibold font-headline">{title}</h3>
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </motion.div>
);

export default function FinSightGuidePage() {
  const instructions = [
    {
      icon: <LayoutDashboard className="h-6 w-6" />,
      title: "Dashboard Overview",
      description: "Your financial hub! Quickly view total income, expenses, net savings, and budget status for the current month. Interactive charts display income, expenses, and savings trends over the past 6 months, plus a breakdown of current month's expenses by category. All figures are shown in your selected currency.",
    },
    {
      icon: <ListChecks className="h-6 w-6" />,
      title: "Managing Transactions",
      description: "Navigate to the 'Transactions' page to add, view, edit, or delete your income and expense records. When adding, specify the date, description, category, amount, and type (income/expense). The table is sortable and filterable for easy searching. The system helps prevent accidental duplicate entries.",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Setting & Tracking Budgets",
      description: "Go to 'Budgets' to set monthly spending goals for various categories. Each budget card shows the allocated amount, how much you've spent (calculated automatically from your expense transactions), and the remaining balance. Visual cues alert you if you're nearing or over budget.",
    },
    {
      icon: <UserCircle className="h-6 w-6" />,
      title: "Profile Management",
      description: "Access your 'Profile' from the user menu (top-right avatar) to view and update your personal information like display name, phone number, date of birth, and gender. Your email address is tied to your login provider and cannot be changed here.",
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Personalizing Settings",
      description: "Visit 'Settings' (also in the user menu) to customize your app experience. Choose your preferred theme (Light, Dark, System), font size (Small, Medium, Large), and default display currency (INR, USD, EUR, GBP). Here, you can also manage account deletion.",
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Notifications",
      description: "The bell icon in the top navigation bar provides updates on budget status (nearing limit or exceeded) and important application messages (like success or error notifications for actions). Unread notifications are indicated by a badge.",
    },
    {
      icon: <ForecastIcon className="h-6 w-6" />,
      title: "Financial Forecast (Future Feature)",
      description: "The 'Forecast' page is where future AI-powered financial projections for your income, expenses, and net balance will appear. This feature is currently under development.",
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div variants={pageHeaderBlockMotionVariants} initial="initial" animate="animate" viewport={{ once: true }}>
        <div className="flex items-center mb-1">
          <BookOpenText className="h-8 w-8 mr-3 text-primary" />
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            FinSight Application Guide
          </h1>
        </div>
        <p className="text-muted-foreground">
          Welcome! Here’s a detailed guide to help you navigate and make the most of FinSight.
        </p>
      </motion.div>

      <motion.div variants={contentMotionVariants} initial="initial" animate="animate" viewport={{ once: true }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">How to Use FinSight</CardTitle>
            <CardDescription>
              Follow these instructions to effectively manage your finances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)] md:h-[calc(100vh-22rem)] pr-4">
              {instructions.map((item, index) => (
                <InstructionItem
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  index={index}
                />
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
