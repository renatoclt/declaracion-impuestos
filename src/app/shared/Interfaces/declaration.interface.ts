export interface Declaration{
    id?: number,
    userId: number,
    period: string,
    totalIncome: number,
    totalExpenses: number,
    taxableIncome: number,
    taxAmount: number,
    status: string,
    taxTypeId: number,
    // receiptUrl: string TODO Luego utilizarlo
}
