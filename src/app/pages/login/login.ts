import { MaterialModule } from '@/app/material.module';
import { LoginCredentials } from '@/app/shared/interfaces/login-credentials';
import { AuthService } from '@/app/shared/services/auth-service';
import { DocumentValidator } from '@/app/shared/validators/document-validator';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  imports: [CommonModule,
    ReactiveFormsModule,
    MaterialModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Signals para manejo de estado
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');
  hidePassword = signal<boolean>(true);

  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      documentType: ['DNI', [Validators.required]],
      documentNumber: ['', [Validators.required, this.documentValidator.bind(this)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Limpiar errores cuando el usuario modifica el formulario
    this.loginForm.valueChanges.subscribe(() => {
      if (this.hasError()) {
        this.hasError.set(false);
        this.errorMessage.set('');
      }
    });

    // Validar documentNumber al cambiar documentType
    this.loginForm.get('documentType')?.valueChanges.subscribe(() => {
      this.loginForm.get('documentNumber')?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.hasError.set(false);
      this.errorMessage.set('');

      const credentials: LoginCredentials = this.loginForm.value;

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success && response.role) {
            this.snackBar.open('¡Bienvenido!', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            console.log(response.role);
            this.authService.redirectByRole(response.role);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set(error.message || 'Error de conexión');
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  getDocumentPlaceholder(): string {
    const documentType = this.loginForm.get('documentType')?.value;
    return documentType === 'DNI' ? '12345678' : '20123456789';
  }

  getDocumentErrorMessage(): string {
    const documentType = this.loginForm.get('documentType')?.value;
    return documentType === 'DNI'
      ? 'El DNI debe tener 8 dígitos'
      : 'El RUC debe tener 11 dígitos';
  }

  private documentValidator(control: any) {
    if (!control.value) return null;

    const documentType = this.loginForm?.get('documentType')?.value;
    if (!documentType) return null;

    const isValid = DocumentValidator.validateDocument(documentType, control.value);
    return isValid ? null : { invalidDocument: true };
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

}
