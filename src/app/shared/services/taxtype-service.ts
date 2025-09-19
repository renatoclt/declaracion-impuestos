import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TaxType } from '../Interfaces/taxtype.interface';
import { environment } from '@/app/pages/environment/environment';
@Injectable({
  providedIn: 'root'
})
export class TaxTypeService {
  private apiUrl = `${environment.apiUrl}/taxTypes`;

  constructor(private http: HttpClient){}

  getTaxType():Observable<TaxType[]>{
    return this.http.get<TaxType[]>(this.apiUrl);
  }

   getTaxTypeById(id:number):Observable<TaxType>{
      return this.http.get<TaxType>(`${this.apiUrl}/${id}`);
    }

    addTaxType(taxtype: TaxType):Observable<TaxType>{
        return this.http.post<TaxType>(this.apiUrl,taxtype)
    }

    updateTaxType(taxtype: TaxType):Observable<TaxType>{
      return this.http.put<TaxType>(`${this.apiUrl}/${taxtype.id}`, taxtype);
    }

    deleteTaxType(id:number):Observable<any>{
      return  this.http.delete(`${this.apiUrl}/${id}`);
    }
  
}