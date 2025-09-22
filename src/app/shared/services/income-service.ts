import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, forkJoin, map, Observable } from 'rxjs';
import { UserService } from './user-service';
import { IIncome } from '../interfaces/income.interface';
import { User } from '../interfaces/user.interface';
import { environment } from '@/app/pages/environment/environment';
@Injectable({
    providedIn: 'root'
})
export class IncomeService {

    private readonly apiUrl = `${environment.apiUrl}/incomes`;

    constructor(private readonly http: HttpClient, private readonly userService: UserService) { }

    getIncomesWithUsers(): Observable<(IIncome & { user?: User })[]> {
        return forkJoin({
            incomes: this.http.get<IIncome[]>(this.apiUrl),
            users: this.userService.getUser()
        }).pipe(
            map(({ incomes, users }) =>
                incomes.map(income => ({
                    ...income,
                    user: users.find(u => u.id === income.userId)
                }))
            ),
            delay(1000)
        );
    }

    getIncomeId(id: number): Observable<IIncome> {
        return this.http.get<IIncome>(`${this.apiUrl}/${id}`);
    }

    addIncome(income: IIncome): Observable<IIncome> {
        return this.http.post<IIncome>(this.apiUrl, income).pipe(delay(2000));
    }

    updateIncome(income: IIncome): Observable<IIncome> {
        return this.http.put<IIncome>(`${this.apiUrl}/${income.id}`, income).pipe(delay(2000));
    }

    deleteIncome(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`).pipe(delay(2000));
    }

    generateId(): Observable<string> {
        return this.getIncomesWithUsers().pipe(
            map(items => {
                if (!items || items.length === 0) { return '100'; }
                const ids = items.map(item => parseInt(item.id, 10)).filter(id => !isNaN(id));
                const maxId = Math.max(...ids);
                return (maxId + 1).toString();
            })
        );
    }

    generateIncomeRequest(formValue: any, userId: number): Observable<IIncome> {
        return this.generateId().pipe(
            map((id) => ({
                id,
                userId,
                source: formValue.type,
                amount: formValue.amount,
                period: `${formValue.year}-${formValue.month}`,
                description: formValue.description
            }))
        );
    }


}