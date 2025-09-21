import { Routes } from '@angular/router';
import { Calculation } from './calculation/calculation';
import { Income } from './income/income';

export const declaration: Routes = [
  {
    path: 'calculation',
    component: Calculation
  },
  {
    path: 'income',
    component: Income
  }
];
