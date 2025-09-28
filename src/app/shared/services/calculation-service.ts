import { environment } from '@/app/pages/environment/environment';
import { Calculation } from './../../pages/declaration/calculation/calculation';
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { UserService } from './user-service';
import { TaxCalculation } from '../interfaces/tax-calculation';

@Injectable({
  providedIn: 'root'
})
export class CalculationService {
   private readonly apiUrl = `${environment.apiUrl}/declarations`;

    constructor(private readonly http: HttpClient) {
    }

    getCalculations(){
      return this.http.get<TaxCalculation[]>(this.apiUrl);
    }

}
