import { Injectable, inject, signal } from '@angular/core';

import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { LoginCredentials } from '../Interfaces/login-credentials';
import { AuthResponse } from '../Interfaces/auth-response';
import { UserRole } from '../enum/user-role';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);

  // Signal para el estado de autenticación
  isAuthenticated = signal<boolean>(this.hasValidToken());

  private readonly TOKEN_KEY = 'auth_token';
  private readonly ROLE_KEY = 'user_role';

  // Simulación de usuarios válidos para demo
  private readonly mockUsers = [
    { documentType: 'DNI' as const, documentNumber: '12345678', password: 'admin123', role: UserRole.Admin },
    { documentType: 'DNI' as const, documentNumber: '87654321', password: 'user123', role: UserRole.User },
    { documentType: 'RUC' as const, documentNumber: '20123456789', password: 'company123', role: UserRole.User }
  ];

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // Simulación de llamada HTTP con delay
    return of(credentials).pipe(
      delay(1500), // Simula latencia de red
      map(creds => {
        // Validar credenciales contra usuarios mock
        const user = this.mockUsers.find(u =>
          u.documentType === creds.documentType &&
          u.documentNumber === creds.documentNumber &&
          u.password === creds.password
        );

        if (user) {
          // Simular JWT token
          const mockToken = this.generateMockJWT(user.documentNumber, user.role);

          // Almacenar token y rol de forma segura
          this.storeAuthData(mockToken, user.role);

          // Actualizar signal
          this.isAuthenticated.set(true);

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
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  getUserRole(): UserRole | null {
    const role = localStorage.getItem(this.ROLE_KEY);
    return (role === UserRole.Admin || role === UserRole.User) ? role : null;
  }

  redirectByRole(role: UserRole): void {
    const routes = {
      admin: '/admin-dashboard',
      user: '/user-dashboard'
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

  private storeAuthData(token: string, role: UserRole): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.ROLE_KEY, role);
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
