
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
    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{description}</p>
  </motion.div>
);

export default function FinSightGuidePage() {
  const instructions = [
    {
      icon: <LayoutDashboard className="h-6 w-6" />,
      title: "Dashboard Overview",
      description: `Your financial command center! The Dashboard provides an at-a-glance summary of your current financial health:
        - **Summary Cards**: Quickly view your Total Income, Total Expenses, Net Savings, and overall Budget Left for the current month. These cards also show percentage change trends compared to the previous month.
        - **Income & Expense Overview Charts**: Line charts visualize your total income and expenses over the last 6 months, helping you identify trends.
        - **Expense Breakdown Chart**: A pie chart illustrates how your expenses are distributed across different categories for the current month.
        - **Net Savings Overview Chart**: This line chart shows your net savings (income minus expenses) over the past 6 months, with a reference line at zero to easily see if you're saving or overspending.
      All financial figures are displayed in the currency you've selected in Settings.`,
    },
    {
      icon: <ListChecks className="h-6 w-6" />,
      title: "Managing Transactions",
      description: `The 'Transactions' page is where you log and manage all your financial activities.
        - **Adding a Transaction**: Click the 'Add Transaction' button. A form will appear where you can enter:
          - Date: When the transaction occurred.
          - Description: A brief note about the transaction (e.g., "Lunch with client", "Electricity Bill").
          - Category: Assign a category (e.g., "Food", "Utilities", "Salary"). This helps in tracking and budgeting.
          - Amount: The value of the transaction.
          - Type: Specify if it's 'Income' or 'Expense'.
        - **Viewing Transactions**: All your transactions are listed in a data table.
        - **Sorting & Filtering**:
          - Click on column headers (like 'Date' or 'Amount') to sort the table.
          - Use the search bar at the top to filter transactions by description, category, etc.
          - Click the 'Columns' button to show or hide specific columns in the table for a cleaner view.
        - **Editing & Deleting**: For each transaction in the table, click the three-dot menu icon ('MoreHorizontal') on the right to find options to 'Edit' or 'Delete' that transaction.
        - **Duplicate Prevention**: The system provides warnings if you try to add a transaction that looks very similar to an existing one (same date, description, category, type but different amount) or prevents an exact duplicate.`,
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Setting & Tracking Budgets",
      description: `Effectively manage your spending by setting monthly budgets on the 'Budgets' page.
        - **Adding a Budget**: Click the 'Add Budget' button. You'll need to provide:
          - Category: The expense category you want to budget for (e.g., "Groceries", "Entertainment"). This should match categories you use for expense transactions.
          - Allocated Amount: The maximum amount you plan to spend for this category in the selected month (in your chosen currency).
          - Month: Select the year and month for which this budget applies.
        - **Understanding Budget Cards**: Each budget you create is displayed as a card:
          - Shows the category, allocated amount, how much you've spent so far, and the remaining balance.
          - A progress bar visually represents your spending against the budget.
        - **Automatic Spending Calculation**: The 'Spent' amount on each budget card is automatically calculated by summing up all expense transactions that match the budget's category and month.
        - **Visual Alerts**:
          - The progress bar changes color (e.g., to yellow or red) as you get closer to or exceed your budget.
          - An alert icon may appear if you're over budget.
        - **Editing & Deleting Budgets**: Each budget card has 'Edit' and 'Delete' icons, allowing you to modify or remove budget entries as needed.`,
    },
    {
      icon: <UserCircle className="h-6 w-6" />,
      title: "Profile Management",
      description: `Access your 'Profile' from the user menu (click your avatar in the top-right corner). Here you can:
        - View your display name and email address.
        - Update your display name, phone number (optional), date of birth, and gender (optional).
      Your email address is linked to your login provider (Google/GitHub) and cannot be changed through the profile page.`,
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Personalizing Settings",
      description: `Customize FinSight to your liking via the 'Settings' page (also in the user menu):
        - **Appearance**:
          - Theme: Choose between Light, Dark, or System default.
          - Font Size: Select Small, Medium, or Large for better readability.
        - **Regional**:
          - Default Currency: Set your preferred currency (INR, USD, EUR, GBP) for displaying all financial figures. Note: Data is stored in a base currency (INR) and converted for display based on fixed rates.
        - **Account Management**:
          - Delete Account: Securely delete your account and all associated data. This action is permanent and requires a confirmation code.
      Remember to click 'Save All Settings' after making changes.`,
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Notifications",
      description: `The bell icon in the top navigation bar is your notification center.
        - It provides updates on important events like:
          - Budgets nearing their limit or being exceeded.
          - Success, error, or warning messages for actions you perform within the app (e.g., saving data, API errors).
        - An indicator (a small dot) will appear on the bell icon if you have unread notifications.
        - Click the bell to view, manage, and clear your notifications.`,
    },
    {
      icon: <ForecastIcon className="h-6 w-6" />,
      title: "Financial Forecast (Future Feature)",
      description: "The 'Forecast' page is designed for future AI-powered financial projections. Soon, you'll be able to see predictions for your future income, expenses, and net balance, helping you plan ahead. This feature is currently under development and will be integrated with Genkit.",
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
