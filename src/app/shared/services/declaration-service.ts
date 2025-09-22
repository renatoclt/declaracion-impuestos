import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { UserService } from './user-service';
import { User } from '../interfaces/user.interface';
import { environment } from '@/app/pages/environment/environment';
import { Declaration } from '../interfaces/declaration.interface';
import { TaxTypeService } from './taxtype-service';
import { TaxType } from '../interfaces/taxtype.interface';
@Injectable({
    providedIn: 'root'
})
export class DeclarationService {
    private apiUrl = `${environment.apiUrl}/declarations`;

    constructor(private http: HttpClient, private userService: UserService, private taxTypeService: TaxTypeService ) { }

    getDeclarationsWithUsersAndTaxType(): Observable<(Declaration & { user?: User; taxType?: TaxType })[]> {
        return forkJoin({
      declarations: this.http.get<Declaration[]>(this.apiUrl),
      users: this.userService.getUser(),
      taxTypes: this.taxTypeService.getTaxType()
    }).pipe(
      map(({ declarations, users, taxTypes }) =>
        declarations.map(d => ({
          ...d,
          user: users.find(u => u.id === d.userId),
          taxType: taxTypes.find(t => t.id === d.taxTypeId)
        }))
      )
    );
    }

    getDeclarationId(id: number): Observable<Declaration> {
        return this.http.get<Declaration>(`${this.apiUrl}/${id}`);
    }

    addDeclaration(declaration: Declaration): Observable<Declaration> {
        return this.http.post<Declaration>(this.apiUrl, declaration)
    }

    updateDeclaration(declaration: Declaration): Observable<Declaration> {
        return this.http.put<Declaration>(`${this.apiUrl}/${declaration.id}`, declaration);
    }

    deleteDeclaration(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

}