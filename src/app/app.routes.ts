import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { UserDashboard } from './pages/user-dashboard/user-dashboard';
import { authGuard } from './shared/guard/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [authGuard]
  },
  {
    path: 'user-dashboard',
    component: UserDashboard,
    canActivate: [authGuard]
  },
  {
    path: 'declaration',
    loadChildren: () => import('./pages/declaration/declaration.routes').then(m => m.declaration),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
