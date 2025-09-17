import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { UserDashboard } from './pages/user-dashboard/user-dashboard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboard
  },
  {
    path: 'user-dashboard',
    component: UserDashboard
  }
];
