import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
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
import { Router } from '@angular/router';
import { IIncome } from '@/app/shared/interfaces/income.interface';
import Swal from 'sweetalert2';


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
export class Income implements OnInit {


  typesIncome = signal<string[]>(INCOME_DATA);
  years = signal<string[]>(YEARS_DATA);
  months = signal<Month[]>(MONTH_DATA);
  dateToday = new Date();
  currentYear = String(this.dateToday.getFullYear());
  month = this.dateToday.getMonth() + 1
  currentMonth = this.month < 10 ? '0' + this.month : String(this.month);
  private readonly router = inject(Router);
  formGroupIncome: FormGroup = new FormGroup({
    type: new FormControl(null),
    amount: new FormControl(null, [Validators.required, Validators.min(0)]),
    year: new FormControl(this.currentYear),
    month: new FormControl(this.currentMonth),
    description: new FormControl('', Validators.required)
  })

 
  incomes = signal<(IIncome & { user?: any })[]>([]);
  loadingList = signal<boolean>(false);
  editingId = signal<string | null>(null);


  textButton: string = 'Guardar';

  private readonly authService: AuthService = inject(AuthService);
  private readonly incomeService: IncomeService = inject(IncomeService);
  private readonly toastService: ToastService = inject(ToastService);

  ngOnInit(): void {
    this.loadIncomes();
  }

  

  onSave(): void {
    if (this.formGroupIncome.invalid) return;

    const userId = Number(this.authService.getUserId());
    this.formGroupIncome.disable();
    this.textButton = this.editingId() ? 'Actualizando...' : 'Guardando...';

    const save$ = this.editingId()
      ? this.incomeService.updateIncome({
        id: this.editingId()!,
        userId,
        source: this.formGroupIncome.value.type,
        amount: this.formGroupIncome.value.amount,
        period: `${this.formGroupIncome.value.year}-${this.formGroupIncome.value.month}`,
        description: this.formGroupIncome.value.description
      } as IIncome)
      : this.incomeService.generateIncomeRequest(this.formGroupIncome.value, userId)
        .pipe(switchMap(req => this.incomeService.addIncome(req)));

    save$
      .pipe(finalize(() => {
        this.textButton = 'Guardar';
        this.formGroupIncome.enable();
      }))
      .subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: this.editingId !== null ? 'Ingreso actualizado' : 'Ingreso creado', timer: 1200, showConfirmButton: false });
          this.formGroupIncome.reset({ year: this.currentYear, month: this.currentMonth });
          this.editingId.set(null);
          this.loadIncomes();
        },
        error: () => this.toastService.showError()
      });
  }

  // Listado
  private loadIncomes(): void {
  this.loadingList.set(true);
  const userId = Number(this.authService.getUserId());

  this.incomeService.getIncomesWithUsers()
    .pipe(finalize(() => this.loadingList.set(false)))
    .subscribe({
      next: (rows) => {
        const mine = rows.filter(r => Number(r.userId) === userId);
        const ordered = mine.sort((a, b) => (b.period || '').localeCompare(a.period || ''));
        this.incomes.set(ordered);
      },
      error: () => this.toastService.showError()
    });
}

  editIncome(row: IIncome & { user?: any }) {
    const [yy, mm] = String(row.period || '').split('-');
    this.formGroupIncome.patchValue({
      type: row.source ?? null,
      amount: row.amount ?? null,
      year: yy || this.currentYear,
      month: mm || this.currentMonth,
      description: row.description || ''
    });
    this.editingId.set(row.id);
    this.textButton = 'Actualizar';

    
  }

  cancelEdit() {
    this.editingId.set(null);
    this.formGroupIncome.reset({ year: this.currentYear, month: this.currentMonth });
  }

  deleteIncome(row: IIncome) {
    Swal.fire({
      title: 'Eliminar gasto',
      text: `¿Seguro que deseas eliminar "${row.description}" ? Esta acción no se puede revertir.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.incomeService.deleteIncome(row.id).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Ingreso Eliminado', timer: 1200, showConfirmButton: false });
          this.loadIncomes();
        },
        error: () => this.toastService.showError()
      });
    });

  }


  back() {
    this.router.navigate(['/dashboard'])
  }
}
