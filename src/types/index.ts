export type Transaction = {
  id: string;
  date: string; // ISO string date for simplicity
  description: string;
  category: string;
  amount: number; // Stored in INR in the backend/context
  type: 'income' | 'expense';
};

export type Budget = {
  id:string;
  category: string;
  allocated: number; // Stored in INR in the backend/context
  spent: number; // Frontend-calculated: total expenses (in INR) for this budget's category & month. Initialized to 0.
  month: string; // Format: YYYY-MM
};

export type SummaryCardData = {
  title: string;
  rawValue: number; // The actual number for animation (assumed to be in INR if it's a currency value)
  prefix?: string;
  suffix?: string;
  isCurrency?: boolean;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down';
  isSimpleTrend?: boolean; // Added for simple bold trend text without icon/color
};

// Schema types for react-hook-form validation (using Zod)
// Amounts in forms are in the user's selected display currency
export type TransactionFormData = {
  date: Date; // react-day-picker uses Date objects
  description: string;
  category: string;
  amount: number; // In selected display currency
  type: 'income' | 'expense';
};

export type BudgetFormData = {
  category: string;
  allocated: number; // In selected display currency
  month: string; // YYYY-MM format
};

// Type for budgets returned from API (before 'spent' is calculated)
export interface BudgetFromApi {
  id: string;
  category: string;
  allocated: number;
  month: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
  read: boolean;
  href?: string; // Optional link for the notification
}

// ===================================
// Types for Group Expense Management
// ===================================

// Main data structure for a group expense record
export interface Group {
  id: string;
  groupName: string;
  email: string;
  members: string[]; // List of member names
  expenses: number[]; // List of expenses corresponding to members
  balance: number[]; // List of balances corresponding to members
  totalExpense: number;
}

// Data structure for the "Create/Edit Group" form
export interface GroupExpenseFormData {
  groupName: string;
  members: Array<{
    name: string;
    expense: number;
    balance: number;
  }>;
  totalExpense: number;
}
