import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);

    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');

    if (!token) {
        router.navigate(['/login']);
        return false;
    }

    if (role === 'admin' && state.url !== '/admin-dashboard') {
        router.navigate(['/admin-dashboard']);
        return false;
    }

    if (role === 'taxpayer' && state.url !== '/dashboard') {
        router.navigate(['/dashboard']);
        return false;
    }

    return true;
};
