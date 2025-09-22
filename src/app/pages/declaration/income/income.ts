import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@/app/shared/services/auth-service';
import { NumberFormatDirective } from '@/app/shared/directives/number.format';
import { IncomeService } from '@/app/shared/services/income-service';
import { finalize, switchMap } from 'rxjs';
import { ToastService } from '@/app/shared/services/toast.service';
import { Month } from '@/app/shared/interfaces/month.interface';
import { MONTH_DATA } from '@/app/shared/data/months';
import { YEARS_DATA } from '@/app/shared/data/years';
import { INCOME_DATA } from '@/app/shared/data/incomes';


@Component({
  selector: 'app-income',
  imports: [MatFormFieldModule,
    MatInputModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    NumberFormatDirective
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './income.html',
  styleUrl: './income.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Income {

  typesIncome = signal<string[]>(INCOME_DATA);
  years = signal<string[]>(YEARS_DATA);
  months = signal<Month[]>(MONTH_DATA);
  dateToday = new Date();
  currentYear = String(this.dateToday.getFullYear());
  month = this.dateToday.getMonth() + 1
  currentMonth = this.month < 10 ? '0' + this.month : String(this.month);

  formGroupIncome: FormGroup = new FormGroup({
    type: new FormControl(null),
    amount: new FormControl(null, [Validators.required, Validators.min(0)]),
    year: new FormControl(this.currentYear),
    month: new FormControl(this.currentMonth),
    description: new FormControl('')
  })


  textButton: string = 'Guardar';

  private readonly authService: AuthService = inject(AuthService);
  private readonly incomeService: IncomeService = inject(IncomeService);
  private readonly toastService: ToastService = inject(ToastService);

  onSave(): void {
    if (this.formGroupIncome.valid) {
      this.formGroupIncome.disable();
      this.textButton = 'Guardando...';
      const userId = Number(this.authService.getUserId());
      this.incomeService.generateIncomeRequest(this.formGroupIncome.value, userId).pipe(
        switchMap((request) => this.incomeService.addIncome(request)),
        finalize(() => {
          this.textButton = 'Guardar';
          this.formGroupIncome.enable()
        })).subscribe({
          next: () => {
            this.formGroupIncome.reset({ year: this.currentYear, month: this.currentMonth });
            this.toastService.showSuccess('Ingreso guardado.');
          },
          error: (err) => {
            console.error(err);
            this.toastService.showError();
          }
        });
    }
  }

}
