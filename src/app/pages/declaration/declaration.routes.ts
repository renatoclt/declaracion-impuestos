import { Routes } from '@angular/router';
import { Calculation } from './calculation/calculation';
import { Income } from './income/income';
import { History } from './history/history';

export const declaration: Routes = [
  {
    path: 'calculation',
    component: Calculation
  },
  {
    path: 'income',
    component: Income
  },
  {
    path: 'history',
    component: History
  }
];
