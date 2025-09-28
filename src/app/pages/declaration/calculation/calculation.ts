import { IncomeService } from './../../../shared/services/income-service';
import { CalculationService } from './../../../shared/services/calculation-service';
import { ExpenseService } from './../../../shared/services/expense-service';
import { TaxTypeService } from '@/app/shared/services/taxtype-service';
// calculation.component.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { TaxType } from '@/app/shared/interfaces/taxtype.interface';
import { TaxCalculation } from '@/app/shared/interfaces/tax-calculation';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableModule } from '@angular/material/table';
import { User } from '@/app/shared/interfaces/user.interface';
import { UserRole } from '@/app/shared/enum/user-role';
import { Expense } from '@/app/shared/interfaces/expenses.interface';
import { IIncome } from '@/app/shared/interfaces/income.interface';
import { UserService } from '@/app/shared/services/user-service';
import { Router } from '@angular/router';




@Component({
  selector: 'app-calculation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatIconModule,
    MatBadgeModule,
    MatTableModule
  ],
  templateUrl: 'calculation.html',
  styleUrls: ['calculation.scss']
})
export class Calculation {
private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private taxTypeService = inject(TaxTypeService);
  private expenseService = inject(ExpenseService);
  private userService = inject(UserService);
  private calculationService = inject(CalculationService);
  private incomeService = inject(IncomeService);
  private readonly router = inject(Router);

  // Signals para manejo de estado
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentStatus = signal<'pending' | 'completed'>('pending');
  taxableIncome = signal(0);
  taxAmount = signal(0);
  selectedTaxRate = signal(0);
  showCalculationSummary = signal(false);
  showIncomeExpenseDetail = signal(false);

  // Lista de cálculos existentes
  calculations = signal<TaxCalculation[]>([]);

  // Columnas de la tabla
  displayedColumns: string[] = [
    'id', 'userId', 'period', 'taxType', 'totalIncome',
    'totalExpenses', 'taxableIncome', 'taxAmount', 'status', 'actions'
  ];

  // Datos de tipos de impuestos
  taxTypes = signal<TaxType[]>([]);

  // Datos de usuarios
  users = signal<User[]>([]);

  // Datos de ingresos
  incomes = signal<IIncome[]>([]);

  // Datos de gastos
  expenses = signal<Expense[]>([]);

  // Formulario reactivo
  calculationForm: FormGroup = this.fb.group({
    userId: [null, [Validators.required]],
    period: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
    taxTypeId: ['', [Validators.required]],
    totalIncome: [null, [Validators.required, Validators.min(0)]],
    totalExpenses: [null, [Validators.required, Validators.min(0)]]
  });

  constructor() {
    this.taxTypeService.getTaxType().subscribe({
       next: (data) => this.taxTypes.set(data)
    });
    this.userService.getUser().subscribe({
      next: (data) => this.users.set(data.filter(u => u.role === UserRole.Taxpayer))
    });
  }
  onTaxTypeChange(): void {
    const taxTypeId = this.calculationForm.get('taxTypeId')?.value;
    const selectedTaxType = this.taxTypes().find(t => t.id === taxTypeId);

    if (selectedTaxType) {
      this.selectedTaxRate.set(selectedTaxType.rate);
      this.calculateTaxes();
    }
  }

  onPeriodOrUserChange(): void {

    const userId = this.calculationForm.get('userId')?.value;
    const period = this.calculationForm.get('period')?.value;

    if (userId && period && period.match(/^\d{4}-\d{2}$/)) {
       this.calculationService.getCalculations().subscribe({
          next: (data) =>
            {
              const filtered = data.filter(calc => calc.userId === userId);
              this.calculations.set(filtered);
              this.getIncomesAndExpenses(userId, period);
            }
      });

      this.showIncomeExpenseDetail.set(true);
    } else {
      this.showIncomeExpenseDetail.set(false);
      this.calculationForm.patchValue({
        totalIncome: 0,
        totalExpenses: 0
      });
    }
  }

  getIncomesAndExpenses(userId: number, period: string): void {
    this.expenseService.getExpensesWithUsers().subscribe({
      next: (expenses) => {
        const filtered = expenses.filter(calc => calc.userId.toString() === userId.toString());
        this.expenses.set(filtered);
        this.calculateIncomeAndExpenses(userId, period);
      }}
    );
    this.incomeService.getIncomesWithUsers().subscribe({
      next: (incomes) => {
        const filtered = incomes.filter(calc => calc.userId.toString() === userId.toString());
        this.incomes.set(filtered);
        this.calculateIncomeAndExpenses(userId, period);
      }}
    );
  }

  calculateIncomeAndExpenses(userId: number, period: string): void {
    // Calcular ingresos totales
    const userIncomes = this.incomes().filter(income =>
      income.userId.toString() === userId.toString() && income.period === period
    );
    const totalIncome = userIncomes.reduce((sum, income) => sum + income.amount, 0);

    // Calcular gastos totales
    const userExpenses = this.expenses().filter(expense =>
      expense.userId.toString() === userId.toString() && expense.period === period
    );
    const totalExpenses = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Actualizar el formulario
    this.calculationForm.patchValue({
      totalIncome: totalIncome,
      totalExpenses: totalExpenses
    });

    // Recalcular impuestos
    this.calculateTaxes();
  }

  calculateTaxes(): void {
    const income = this.calculationForm.get('totalIncome')?.value || 0;
    const expenses = this.calculationForm.get('totalExpenses')?.value || 0;
    const rate = this.selectedTaxRate();

    if (income >= 0 && expenses >= 0 && rate > 0) {
      const taxableAmount = Math.max(0, income - expenses);
      const calculatedTax = taxableAmount * rate;

      this.taxableIncome.set(taxableAmount);
      this.taxAmount.set(calculatedTax);
      this.showCalculationSummary.set(true);
    } else {
      this.showCalculationSummary.set(false);
    }
  }

  updateStatus(status: 'pending' | 'completed'): void {
    this.currentStatus.set(status);
    this.snackBar.open(
      `Estado actualizado a: ${status === 'pending' ? 'Pendiente' : 'Completado'}`,
      'Cerrar',
      { duration: 3000 }
    );
  }

  onSubmit(): void {
    if (this.calculationForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      // Simular guardado
      setTimeout(() => {
        try {
          const formData = this.calculationForm.value;

          const calculation: TaxCalculation = {
            id: this.generateId(),
            userId: formData.userId,
            period: formData.period,
            totalIncome: formData.totalIncome,
            totalExpenses: formData.totalExpenses,
            taxableIncome: this.taxableIncome(),
            taxAmount: this.taxAmount(),
            status: this.currentStatus(),
            taxTypeId: formData.taxTypeId
          };

          console.log('Cálculo guardado:', calculation);

          // Agregar a la lista de cálculos
          this.calculations.update(calcs => [...calcs, calculation]);

          this.snackBar.open(
            '¡Cálculo de impuestos guardado exitosamente!',
            'Cerrar',
            { duration: 5000 }
          );

          // Limpiar formulario después del guardado exitoso
          this.resetForm();

          this.isLoading.set(false);
        } catch (error) {
          this.errorMessage.set('Error al guardar el cálculo. Intente nuevamente.');
          this.isLoading.set(false);
        }
      }, 2000);
    } else {
      this.markFormGroupTouched();
    }
  }

  resetForm(): void {
    this.calculationForm.reset();
    this.currentStatus.set('pending');
    this.taxableIncome.set(0);
    this.taxAmount.set(0);
    this.selectedTaxRate.set(0);
    this.showCalculationSummary.set(false);
    this.showIncomeExpenseDetail.set(false);
    this.errorMessage.set(null);

    this.snackBar.open('Formulario limpiado', 'Cerrar', { duration: 2000 });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.calculationForm.controls).forEach(key => {
      this.calculationForm.get(key)?.markAsTouched();
    });
  }

  private generateId(): string {
    return Math.floor(Math.random() * 1000) + 400 + '';
  }

  // Métodos para la tabla de cálculos
  getTaxTypeName(taxTypeId: string): string {
    const taxType = this.taxTypes().find(t => t.id === taxTypeId);
    return taxType ? taxType.name : 'Desconocido';
  }

  getTaxTypeRate(taxTypeId: string): number {
    const taxType = this.taxTypes().find(t => t.id === taxTypeId);
    return taxType ? taxType.rate : 0;
  }

  editCalculation(calculation: TaxCalculation): void {
    // Cargar datos en el formulario
    this.calculationForm.patchValue({
      userId: calculation.userId,
      period: calculation.period,
      taxTypeId: calculation.taxTypeId,
      totalIncome: calculation.totalIncome,
      totalExpenses: calculation.totalExpenses
    });

    this.currentStatus.set(calculation.status);
    this.onTaxTypeChange();

    this.snackBar.open('Cálculo cargado para edición', 'Cerrar', { duration: 3000 });

    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteCalculation(id: string): void {
    if (confirm('¿Está seguro de eliminar este cálculo?')) {
      this.calculations.update(calcs => calcs.filter(c => c.id !== id));
      this.snackBar.open('Cálculo eliminado exitosamente', 'Cerrar', { duration: 3000 });
    }
  }

  markAsCompleted(id: string): void {
    this.calculations.update(calcs =>
      calcs.map(calc =>
        calc.id === id ? { ...calc, status: 'completed' as const } : calc
      )
    );
    this.snackBar.open('Cálculo marcado como completado', 'Cerrar', { duration: 3000 });
  }

  // Métodos para estadísticas
  getCompletedCount(): number {
    return this.calculations().filter(c => c.status === 'completed').length;
  }

  getPendingCount(): number {
    return this.calculations().filter(c => c.status === 'pending').length;
  }

  getTotalIncome(): number {
    return this.calculations().reduce((sum, calc) => sum + calc.totalIncome, 0);
  }

  getTotalTaxes(): number {
    return this.calculations().reduce((sum, calc) => sum + calc.taxAmount, 0);
  }

  // Métodos para obtener información del usuario
  getUserName(userId: number): string {
    const user = this.users().find(u => u.id === userId);
    return user ? user.name : `Usuario ${userId}`;
  }

  getUserEmail(userId: number): string {
    const user = this.users().find(u => u.id === userId);
    return user ? user.email : 'Email no encontrado';
  }

  getUserDocumentNumber(userId: number): string {
    const user = this.users().find(u => u.id === userId);
    return user ? user.documentNumber : 'N/A';
  }

  // Métodos para obtener datos de ingresos y gastos actuales
  getCurrentIncomes(): IIncome[] {
    const userId = this.calculationForm.get('userId')?.value;
    const period = this.calculationForm.get('period')?.value;

    if (!userId || !period) return [];

    return this.incomes().filter(income =>
      income.userId === userId && income.period === period
    );
  }

  getCurrentExpenses(): Expense[] {
    const userId = this.calculationForm.get('userId')?.value;
    const period = this.calculationForm.get('period')?.value;

    if (!userId || !period) return [];

    return this.expenses().filter(expense =>
      expense.userId === userId && expense.period === period
    );
  }

  getCurrentPeriod(): string {
    return this.calculationForm.get('period')?.value || '';
  }

  getIncomeCount(): number {
    return this.getCurrentIncomes().length;
  }

  getExpenseCount(): number {
    return this.getCurrentExpenses().length;
  }
  back() {
    this.router.navigate(['/dashboard'])
  }
}
