import { TaxType } from './../../../shared/Interfaces/taxtype.interface';
import { UserService } from './../../../shared/services/user-service';
import { MaterialModule } from '@/app/material.module';
import { Declaration } from '@/app/shared/Interfaces/declaration.interface';
import { Expense } from '@/app/shared/Interfaces/expenses.interface';
import { Income } from '@/app/shared/Interfaces/income.interface';
import { TaxCalculation } from '@/app/shared/Interfaces/tax-calculation';
import { User } from '@/app/shared/Interfaces/user.interface';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import { TaxTypeService } from '@/app/shared/services/taxtype-service';
import { IncomeService } from '@/app/shared/services/income-service';
import { ExpenseService } from '@/app/shared/services/expense-service';

@Component({
  selector: 'app-calculation',
  imports: [CommonModule,
    ReactiveFormsModule,
    MaterialModule],
  templateUrl: './calculation.html',
  styleUrl: './calculation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Calculation {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private userService = inject(UserService);
  private taxTypeService = inject(TaxTypeService);
  private incomeService = inject(IncomeService);
  private expenseService = inject(ExpenseService);


  // Signals para manejo de estado
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  users = signal<User[]>([]);
  taxTypes = signal<TaxType[]>([]);
  incomes = signal<Income[]>([]);
  expenses = signal<Expense[]>([]);
  selectedUser = signal<User | null>(null);
  taxCalculation = signal<TaxCalculation | null>(null);

  // Form reactivo
  calculationForm: FormGroup = this.fb.group({
    userId: ['', Validators.required],
    period: ['', Validators.required],
    taxTypeId: ['', Validators.required]
  });

  // Computed properties
  displayedIncomeColumns = ['source', 'amount', 'description'];
  displayedExpenseColumns = ['category', 'amount', 'description'];

  filteredIncomes = computed(() => {
    const user = this.selectedUser();
    const period = this.calculationForm?.get('period')?.value;
    if (!user || !period) return [];

    return this.incomes().filter(income =>
      income.userId === user.id && income.period === period
    );
  });

  filteredExpenses = computed(() => {
    const user = this.selectedUser();
    const period = this.calculationForm?.get('period')?.value;
    if (!user || !period) return [];

    return this.expenses().filter(expense =>
      expense.userId === user.id && expense.period === period
    );
  });

  ngOnInit() {
    this.loadInitialData();
    this.setupFormSubscriptions();
  }

  private loadInitialData() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const requests = {
      users: this.userService.getUser(),
      taxTypes: this.taxTypeService.getTaxType(),
      incomes: this.incomeService.getIncomesWithUsers(),
      expenses: this.expenseService.getExpensesWithUsers()
    };

    forkJoin(requests).subscribe({
      next: (responses) => {
        this.users.set(responses.users);
        this.taxTypes.set(responses.taxTypes);
        this.incomes.set(responses.incomes);
        this.expenses.set(responses.expenses);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Error al cargar los datos iniciales');
        this.isLoading.set(false);
        console.error('Error loading data:', error);
      }
    });
  }

  private setupFormSubscriptions() {
    // Suscripción a cambios en userId
    this.calculationForm.get('userId')?.valueChanges.subscribe(userId => {
      if (userId) {
        const user = this.users().find(u => u.id === parseInt(userId));
        this.selectedUser.set(user || null);
        this.calculateTaxes();
      }
    });

    // Suscripción a cambios en period y taxTypeId
    this.calculationForm.get('period')?.valueChanges.subscribe(() => {
      this.calculateTaxes();
    });

    this.calculationForm.get('taxTypeId')?.valueChanges.subscribe(() => {
      this.calculateTaxes();
    });
  }

  calculateTaxes() {
    const userId = this.calculationForm.get('userId')?.value;
    const period = this.calculationForm.get('period')?.value;
    const taxTypeId = this.calculationForm.get('taxTypeId')?.value;

    if (!userId || !period || !taxTypeId) {
      this.taxCalculation.set(null);
      return;
    }

    const userIncomes = this.filteredIncomes();
    const userExpenses = this.filteredExpenses();
    const selectedTaxType = this.taxTypes().find(t => t.id === parseInt(taxTypeId));

    if (!selectedTaxType) return;

    const totalIncome = userIncomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const taxableIncome = Math.max(0, totalIncome - totalExpenses);

    // Cálculos de impuestos
    const irRate = this.taxTypes().find(t => t.name.includes('IR'))?.rate || 0.30;
    const igvRate = this.taxTypes().find(t => t.name.includes('IGV'))?.rate || 0.18;

    const irTax = taxableIncome * irRate;
    const igvTax = totalIncome * igvRate;
    const totalTax = irTax + igvTax;

    this.taxCalculation.set({
      totalIncome,
      totalExpenses,
      taxableIncome,
      irTax,
      igvTax,
      totalTax
    });
  }

  onSubmit() {
    if (this.calculationForm.valid && this.taxCalculation()) {
      this.isLoading.set(true);

      const calculation = this.taxCalculation()!;
      const formValue = this.calculationForm.value;

      const declaration: Declaration = {
        userId: parseInt(formValue.userId),
        period: formValue.period,
        totalIncome: calculation.totalIncome,
        totalExpenses: calculation.totalExpenses,
        taxableIncome: calculation.taxableIncome,
        taxAmount: calculation.totalTax,
        status: 'completed',
        taxTypeId: parseInt(formValue.taxTypeId)
      };

      // Simular guardado en la base de datos
      setTimeout(() => {
        this.isLoading.set(false);
        this.snackBar.open('Cálculo guardado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }, 1500);
    }
  }

  generatePDF() {
    if (!this.taxCalculation() || !this.selectedUser()) return;

    const calculation = this.taxCalculation()!;
    const user = this.selectedUser()!;
    const period = this.calculationForm.get('period')?.value;

    const pdf = new jsPDF();

    // Configurar PDF
    pdf.setFontSize(20);
    pdf.text('COMPROBANTE DE CÁLCULO DE IMPUESTOS', 20, 30);

    pdf.setFontSize(12);
    pdf.text(`Contribuyente: ${user.name}`, 20, 50);
    pdf.text(`Documento: ${user.documentType} - ${user.documentNumber}`, 20, 60);
    pdf.text(`Período: ${period}`, 20, 70);
    pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 20, 80);

    // Línea separadora
    pdf.line(20, 90, 190, 90);

    // Resumen financiero
    pdf.text('RESUMEN FINANCIERO', 20, 110);
    pdf.text(`Total Ingresos: S/ ${calculation.totalIncome.toFixed(2)}`, 30, 125);
    pdf.text(`Total Gastos: S/ ${calculation.totalExpenses.toFixed(2)}`, 30, 135);
    pdf.text(`Renta Gravable: S/ ${calculation.taxableIncome.toFixed(2)}`, 30, 145);

    // Cálculo de impuestos
    pdf.text('CÁLCULO DE IMPUESTOS', 20, 165);
    pdf.text(`Impuesto a la Renta (IR): S/ ${calculation.irTax.toFixed(2)}`, 30, 180);
    pdf.text(`IGV: S/ ${calculation.igvTax.toFixed(2)}`, 30, 190);
    pdf.text(`TOTAL A PAGAR: S/ ${calculation.totalTax.toFixed(2)}`, 30, 200);

    // Detalle de ingresos
    if (this.filteredIncomes().length > 0) {
      pdf.text('DETALLE DE INGRESOS', 20, 220);
      let y = 235;
      this.filteredIncomes().forEach(income => {
        pdf.text(`- ${income.source}: S/ ${income.amount.toFixed(2)}`, 30, y);
        y += 10;
      });
    }

    // Detalle de gastos
    if (this.filteredExpenses().length > 0) {
      const startY = this.filteredIncomes().length > 0 ? 235 + (this.filteredIncomes().length * 10) + 10 : 220;
      pdf.text('DETALLE DE GASTOS', 20, startY);
      let y = startY + 15;
      this.filteredExpenses().forEach(expense => {
        pdf.text(`- ${expense.category}: S/ ${expense.amount.toFixed(2)}`, 30, y);
        y += 10;
      });
    }

    // Descargar PDF
    pdf.save(`comprobante-impuestos-${user.documentNumber}-${period}.pdf`);

    this.snackBar.open('PDF generado exitosamente', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  resetForm() {
    this.calculationForm.reset();
    this.selectedUser.set(null);
    this.taxCalculation.set(null);
    this.errorMessage.set(null);
  }
}
