export interface Expense{
    id: string|number,
    userId: number|string,
    category: string,
    amount: number,
    period: string,
    description: string
}