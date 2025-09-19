import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { TaxType } from '../Interfaces/taxtype.interface';
import { UserService } from './user-service';
import { Income } from '../Interfaces/income.interface';
import { User } from '../Interfaces/user.interface';
import { environment } from '@/app/pages/environment/environment';
@Injectable({
    providedIn: 'root'
})
export class IncomeService {
    private apiUrl = `${environment.apiUrl}/incomes`;

    constructor(private http: HttpClient, private userService: UserService) { }

    getIncomesWithUsers(): Observable<(Income & { user?: User })[]> {
        return forkJoin({
            incomes: this.http.get<Income[]>(this.apiUrl),
            users: this.userService.getUser()
        }).pipe(
            map(({ incomes, users }) =>
                incomes.map(income => ({
                    ...income,
                    user: users.find(u => u.id === income.userId)
                }))
            )
        );
    }

    getIncomeId(id: number): Observable<Income> {
        return this.http.get<Income>(`${this.apiUrl}/${id}`);
    }

    addIncome(taxtype: Income): Observable<Income> {
        return this.http.post<Income>(this.apiUrl, taxtype)
    }

    updateIncome(taxtype: Income): Observable<Income> {
        return this.http.put<Income>(`${this.apiUrl}/${taxtype.id}`, taxtype);
    }

    deleteIncome(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

}