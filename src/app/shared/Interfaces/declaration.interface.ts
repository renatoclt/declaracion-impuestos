export interface Declaration {
    id?: number,
    userId: number,
    period: string,
    totalIncome: number,
    totalExpenses: number,
    taxableIncome: number,
    taxAmount: number,
    status: 'pending' | 'completed',
    taxTypeId: number,
    receiptUrl?: string,
}
