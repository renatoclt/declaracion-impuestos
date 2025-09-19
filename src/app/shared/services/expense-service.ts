import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { UserService } from './user-service';
import { User } from '../Interfaces/user.interface';
import { environment } from '@/app/pages/environment/environment';
import { Expense } from '../Interfaces/expenses.interface';
@Injectable({
    providedIn: 'root'
})
export class ExpenseService {
    private apiUrl = `${environment.apiUrl}/expenses`;

    constructor(private http: HttpClient, private userService: UserService) { }

    getExpensesWithUsers(): Observable<(Expense & { user?: User })[]> {
        return forkJoin({
            expenses: this.http.get<Expense[]>(this.apiUrl),
            users: this.userService.getUser()
        }).pipe(
            map(({ expenses, users }) =>
                expenses.map(expense => ({
                    ...expense,
                    user: users.find(u => u.id === expense.userId)
                }))
            )
        );
    }

    getExpenseId(id: number): Observable<Expense> {
        return this.http.get<Expense>(`${this.apiUrl}/${id}`);
    }

    addExpense(expense: Expense): Observable<Expense> {
        return this.http.post<Expense>(this.apiUrl, expense)
    }

    updateExpense(expense: Expense): Observable<Expense> {
        return this.http.put<Expense>(`${this.apiUrl}/${expense.id}`, expense);
    }

    deleteExpense(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

}