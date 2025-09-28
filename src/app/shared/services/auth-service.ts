import { UserService } from './user-service';
import { Injectable, inject, signal } from '@angular/core';

import { Router } from '@angular/router';
import { Observable, of, throwError, Subject } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { UserRole } from '../enum/user-role';
import { User } from '../interfaces/user.interface';
import { LoginCredentials } from '../interfaces/login-credentials';
import { AuthResponse } from '../interfaces/auth-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private userService = inject(UserService);
  // Signal para el estado de autenticación
  isAuthenticated = signal<boolean>(this.hasValidToken());

  private readonly TOKEN_KEY = 'auth_token';
  authStatus$ = new Subject<boolean>();
  private readonly ROLE_KEY = 'user_role';
  private readonly USER_ID = 'user_id';


  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // Obtener usuarios desde el servicio y validar credenciales
    return this.userService.getUser().pipe(
      map(users => {
        // Validar credenciales contra usuarios obtenidos del servicio
        const user = users.find(u =>
          u.documentType === credentials.documentType &&
          u.documentNumber === credentials.documentNumber &&
          u.password === credentials.password
        );

        if (user) {
          // Simular JWT token
          const mockToken = this.generateMockJWT(user.documentNumber, user.role);

          // Almacenar token y rol de forma segura
          this.storeAuthData(mockToken, user.role, String(user.id));

          // Actualizar signal
          this.isAuthenticated.set(true);

          this.authStatus$.next(true);
          return {
            success: true,
            token: mockToken,
            role: user.role,
            message: 'Autenticación exitosa'
          };
        } else {
          // Error genérico para prevenir enumeración de usuarios
          throw new Error('Credenciales incorrectas');
        }
      }),
      catchError((error: any) => {
        return throwError(() => ({
          success: false,
          message: 'Credenciales incorrectas'
        }));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USER_ID);
    this.isAuthenticated.set(false);
    this.authStatus$.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  getUserRole(): UserRole | null {
    const role = localStorage.getItem(this.ROLE_KEY);
    return (role === UserRole.Admin || role === UserRole.Taxpayer) ? role : null;
  }

  getUserId(): string | null {
    return localStorage.getItem(this.USER_ID);
  }

  redirectByRole(role: UserRole): void {

    const routes = {
      admin: '/admin-dashboard',
      taxpayer: '/user-dashboard'
    };
    this.router.navigate([routes[role]]);
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;

    try {
      // Verificar si el token no ha expirado (simulación básica)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  private storeAuthData(token: string, role: UserRole, id: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.ROLE_KEY, role);
    localStorage.setItem(this.USER_ID, id);
  }

  private generateMockJWT(documentNumber: string, role: UserRole): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: documentNumber,
      role: role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hora
    };

    // Mock JWT (solo para demo - en producción usar biblioteca JWT)
    return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.mock_signature`;
  }
}
