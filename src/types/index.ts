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
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down';
};
