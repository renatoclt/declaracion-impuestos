import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { UserService } from './user-service';
import { User } from '../interfaces/user.interface';
import { environment } from '@/app/pages/environment/environment';
import { Expense } from '@/app/shared/interfaces/expenses.interface';
@Injectable({
    providedIn: 'root'
})
export class ExpenseService {
    private readonly apiUrl = `${environment.apiUrl}/expenses`;

    constructor(private readonly http: HttpClient, private readonly userService: UserService) { }

    getExpensesWithUsers(): Observable<(Expense & { user?: User })[]> {
        return forkJoin({
            expenses: this.http.get<Expense[]>(this.apiUrl),
            users: this.userService.getUser()
        }).pipe(
            map(({ expenses, users }) =>
                expenses.map(expense => ({
                    ...expense,
                    user: users.find(u => Number(u.id) === Number(expense.userId))
                }))
            )
        );
    }

    getNextExpenseId(): Observable<number> {
        return this.http.get<Expense[]>(this.apiUrl).pipe(
            map(list => {
                const nums = list
                    .map(e => Number((e as any).id))
                    .filter(n => !isNaN(n));
                const max = nums.length ? Math.max(...nums) : 0;
                return max + 1;
            })
        );
    }

    getExpenseId(id: string | number): Observable<Expense> {
        return this.http.get<Expense>(`${this.apiUrl}/${id}`);
    }

    addExpense(expense: Omit<Expense, 'id'>): Observable<Expense> {
        return this.http.post<Expense>(this.apiUrl, expense);
    }

    updateExpense(expense: Expense): Observable<Expense> {
        return this.http.put<Expense>(`${this.apiUrl}/${expense.id}`, expense);
    }

    deleteExpense(id: string | number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

}
