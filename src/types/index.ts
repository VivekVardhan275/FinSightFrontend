
export type Transaction = {
  id: string;
  date: string; // ISO string date for simplicity
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
};

export type Budget = {
  id:string;
  category: string;
  allocated: number;
  spent: number;
  month: string; // Format: YYYY-MM
};

export type SummaryCardData = {
  title: string;
  rawValue: number; // The actual number for animation
  prefix?: string;
  suffix?: string;
  isCurrency?: boolean;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down';
};

// Schema types for react-hook-form validation (using Zod)
export type TransactionFormData = {
  date: Date; // react-day-picker uses Date objects
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
};

export type BudgetFormData = {
  category: string;
  allocated: number;
  month: string; // YYYY-MM format
};

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
  read: boolean;
  href?: string; // Optional link for the notification
}
