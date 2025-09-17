
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
        - Summary Cards: Quickly view your Total Income, Total Expenses, Net Savings, and overall Budget Left for the current month. These cards also show percentage change trends compared to the previous month, giving you insight into your financial momentum.
        - Income & Expense Overview Charts: Line charts visualize your total income and expenses over the last 6 months. This helps you identify spending patterns, periods of high income, or months where expenses spiked.
        - Expense Breakdown Chart: A pie chart illustrates how your expenses are distributed across different categories for the current month. This is key to understanding where your money is going.
        - Net Savings Overview Chart: This line chart shows your net savings (income minus expenses) over the past 6 months, with a reference line at zero to easily see if you're saving or overspending consistently.
      All financial figures are displayed in the currency you've selected in Settings, making it relevant to your preferred view.`,
    },
    {
      icon: <ListChecks className="h-6 w-6" />,
      title: "Managing Transactions",
      description: `The 'Transactions' page is where you log and manage all your financial activities. Accurate transaction logging is crucial for all other features.
        - Adding a Transaction:
          1. Click the 'Add Transaction' button (usually with a PlusCircle icon).
          2. A form will appear. Fill in these details:
             - Date: The date the transaction occurred.
             - Description: A clear note about the transaction (e.g., "Lunch with client", "Electricity Bill - July", "Monthly Salary").
             - Category: Assign a relevant category (e.g., "Food", "Utilities", "Salary", "Transport"). Consistent categorization helps in tracking and budgeting.
             - Amount: The monetary value of the transaction.
             - Type: Specify if it's 'Income' (money coming in) or 'Expense' (money going out).
          3. Click 'Save Transaction'.
        - Viewing Transactions: All your entered transactions are listed in a data table.
        - Sorting & Filtering:
          - Sorting: Click on column headers (like 'Date' or 'Amount') to sort the table by that column in ascending or descending order. An arrow will indicate the sort direction.
          - Filtering: Use the search bar at the top of the table (often labeled "Filter transactions...") to find specific transactions. You can type keywords from the description, category, etc.
          - Column Visibility: Look for a 'Columns' button. This allows you to show or hide specific columns in the table, customizing your view for clarity.
        - Editing & Deleting:
          - For each transaction in the table, there's usually a three-dot menu icon (MoreHorizontal) on the right side of the row.
          - Click this icon to reveal options like 'Edit' or 'Delete'.
          - 'Edit' will open the transaction form pre-filled with the transaction's data for you to modify.
          - 'Delete' will prompt for confirmation before permanently removing the transaction.
        - Duplicate Prevention: The system has basic checks. It might warn you if you try to add a transaction that looks very similar to an existing one (e.g., same date, description, category, type but a slightly different amount). It generally prevents exact duplicates.
      Regularly updating your transactions ensures your dashboard and budget tracking are accurate.`,
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Setting & Tracking Budgets",
      description: `Effectively manage your spending by setting monthly budgets on the 'Budgets' page. Budgets help you control your expenses in specific categories.
        - Adding a Budget:
          1. Click the 'Add Budget' button.
          2. You'll need to provide:
             - Category: The expense category you want to budget for (e.g., "Groceries", "Entertainment", "Shopping"). This should match the categories you use for your expense transactions.
             - Allocated Amount: The maximum amount you plan to spend for this category in the selected month (in your chosen display currency).
             - Month: Select the specific year and month for which this budget applies (e.g., July 2024).
          3. Click 'Save Budget'.
        - Understanding Budget Cards: Each budget you create is displayed as a card, showing:
          - Category name and the month it applies to.
          - Allocated Amount: The total you planned to spend.
          - Spent Amount: How much you've actually spent in that category for that month (calculated automatically from your expense transactions).
          - Remaining Balance: Allocated minus Spent.
          - Progress Bar: A visual representation of your spending against the budget.
        - Automatic Spending Calculation: The 'Spent' amount on each budget card is automatically updated whenever you add, edit, or delete an expense transaction that matches the budget's category and month.
        - Visual Alerts & Progress:
          - The progress bar changes color (e.g., to yellow or red) as you get closer to or exceed your budget, providing an immediate visual cue.
          - An alert icon (like AlertTriangle) may appear if you're over budget, drawing your attention.
        - Editing & Deleting Budgets: Each budget card typically has 'Edit' and 'Delete' icons (often Edit2 and Trash2).
          - 'Edit' allows you to change the category, allocated amount, or month for that budget.
          - 'Delete' will remove the budget entry after confirmation.
      Budgets are most effective when reviewed regularly against your actual spending (transactions).`,
    },
    {
      icon: <UserCircle className="h-6 w-6" />,
      title: "Profile Management",
      description: `Access your 'Profile' from the user menu (usually by clicking your avatar or name in the top-right corner of the application). On the Profile page, you can:
        - View your display name and email address.
        - Update your display name (this is how your name appears within the app).
        - Update your phone number (this is typically optional).
        - Set or update your date of birth.
        - Set or update your gender (options usually include Male, Female, Other, Prefer not to say).
      Your email address is generally tied to your login provider (Google/GitHub) and cannot be changed through the profile page. Changes are saved when you click an 'Update' or 'Save Changes' button.`,
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Personalizing Settings",
      description: `Customize FinSight to your liking via the 'Settings' page, also accessible from the user menu.
        - Appearance Settings:
          - Theme: Choose between 'Light', 'Dark', or 'System' default themes to change the overall look of the app.
          - Font Size: Select 'Small', 'Medium', or 'Large' font sizes for better readability across the application.
        - Regional Settings:
          - Default Currency: Set your preferred currency for displaying all financial figures (e.g., INR, USD, EUR, GBP). Note: The application might store data in a base currency (like INR) and convert it for display based on pre-defined fixed rates.
        - Account Management:
          - Delete Account: This section allows you to securely delete your account and all associated data. This action is permanent and usually requires a confirmation step (like entering a code) to prevent accidental deletion.
      Remember to click a 'Save All Settings' or similar button to apply your changes. Some changes like theme might apply instantly, while others are saved to your profile.`,
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Notifications",
      description: `The bell icon in the top navigation bar is your notification center. It keeps you informed about important events and application feedback.
        - Types of Notifications:
          - Budget status: Alerts when you are nearing your budget limit for a category or when you have exceeded it.
          - Action Confirmations: Success, error, or warning messages for actions you perform, like saving a transaction, updating settings, or if an API call fails.
        - Unread Indicator: A small dot or badge will typically appear on the bell icon if you have unread notifications.
        - Viewing & Managing: Click the bell icon to open the notifications panel. Here you can:
          - See a list of your recent notifications.
          - Mark individual notifications as read.
          - Mark all notifications as read.
          - Clear individual or all notifications.
        Notifications help you stay on top of your financial activities and application status.`,
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
