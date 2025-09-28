export interface TaxCalculation {
    id?: string;
  userId: number;
  period: string;
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  taxAmount: number;
  status: 'pending' | 'completed';
  taxTypeId: string;
  receiptUrl?: string;
}
