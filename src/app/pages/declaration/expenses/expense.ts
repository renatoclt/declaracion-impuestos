import { FormConfig } from "@/app/shared/interfaces/admin-form.interface";
import { Expense } from "@/app/shared/interfaces/expenses.interface";
import { Reporte } from "@/app/shared/interfaces/report-form.interface";
import { User } from "@/app/shared/interfaces/user.interface";
import { ExpenseService } from "@/app/shared/services/expense-service";
import { UserService } from "@/app/shared/services/user-service";
import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal, WritableSignal } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { Router } from "@angular/router";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  templateUrl: './expense.html'
})

export class ExpenseComponent implements OnInit {

  users: WritableSignal<User[]> = signal([]);
  expenses: WritableSignal<(Expense & { userName?: string })[]> = signal([]);
  private readonly router = inject(Router);
  loading = signal(false);
  message = signal<{ type: 'success' | 'danger' | 'info', text: string } | null>(null);

  flash(type: 'success' | 'danger' | 'info', text: string): void {
    this.message.set({ type, text });
    setTimeout(() => this.message.set(null), 2500);
  }

  editingId: string | number | null = null;

  submitted = false;

  formModel: Record<string, any> = {};

  formConfig: FormConfig = {
    labelSize: '',
    items: [
      {
        label: 'Contribuyente',
        prop: 'userId',
        type: 'select',
        required: true,
        col: 'col-12 col-md-4',
        inputType: 'text',
        options: []
      },
      {
        label: 'Periodo',
        prop: 'period',
        type: 'input',
        required: true,
        inputType: 'text',
        placeholder: 'YYYY-MM (ej. 2025-01)',
        pattern: '^\\d{4}-(0[1-9]|1[0-2])$',
        col: 'col-6 col-md-3'
      },
      {
        label: 'Monto',
        prop: 'amount',
        type: 'input',
        required: true,
        inputType: 'number',
        min: 0.01,
        placeholder: '0.00',
        col: 'col-6 col-md-2'
      },
      {
        label: 'Descripción',
        prop: 'description',
        type: 'input',
        required: true,
        inputType: 'text',
        placeholder: 'Ej. Matrícula universitaria / clínica / gasolina',
        col: 'col-12 col-md-3'
      },
      {
        label: 'Categoría',
        prop: 'category',
        type: 'select',
        required: true,
        inputType: 'text',
        options: [
          { value: 'Educación', label: 'Educación' },
          { value: 'Salud', label: 'Salud' },
          { value: 'Alimentación', label: 'Alimentación' },
          { value: 'Transporte', label: 'Transporte' },
          { value: 'Vivienda', label: 'Vivienda' },
          { value: 'Vestimenta', label: 'Vestimenta' },
          { value: 'Otros', label: 'Otros' }
        ],
        col: 'col-12 col-md-3'
      }
    ]
  };

  tableConfig: Reporte = {
    cabecera: [
      { cabecera: 'ID', cabeceraData: '__index' },
      { cabecera: 'Contribuyente', cabeceraData: 'userName' },
      { cabecera: 'Periodo', cabeceraData: 'period' },
      { cabecera: 'Monto', cabeceraData: 'amount' },
      { cabecera: 'Descripción', cabeceraData: 'description' },
      { cabecera: 'Categoría', cabeceraData: 'category' }
    ],
    numeroPagina: 10,
    titulo: 'Gastos registrados'
  };


  constructor(private readonly expenseService: ExpenseService, private readonly userService: UserService) { }


  ngOnInit(): void {
    //cargar usuarios y después gastos
    this.loadUsersThenExpenses();
  }

  // Carga usuarios y despues carga gastos
  private loadUsersThenExpenses(): void {
    this.userService.getUser().subscribe({
      next: (users) => {
        this.users.set(users);

         const contribuyente = users.filter(u =>
        (u.role ?? '').toLowerCase() !== 'admin' &&
        (u.username ?? '').toLowerCase() !== 'admin' &&
        (u.name ?? '').toLowerCase() !== 'administrador'
      );

        // Se llena el Contribuyente
        const userItem = this.formConfig.items.find(i => i.prop === 'userId');
        if (userItem) {
          userItem.options = contribuyente.map(u => ({
            value: Number(u.id),
            label: `${u.name} (${u.documentType}: ${u.documentNumber || '—'})`
          }));
        }
        const firstId = contribuyente.length ? Number(contribuyente[0].id) : null;
        this.formModel = { userId: firstId, category: 'Otros' };
        this.loadExpenses();
      },
      error: () => this.flash('danger', 'No se pudieron cargar los usuarios.')
    });
  }

  private loadExpenses(): void {
    this.loading.set(true);
    this.expenseService.getExpensesWithUsers().subscribe({
      next: (data) => {
        const users = this.users();
        const vm = data.map(e => ({
          ...e,
          userName: e.user?.name
            ?? users.find(u => Number(u.id) === Number(e.userId))?.name
            ?? `ID ${e.userId}`
        }));
        this.expenses.set(vm);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.flash('danger', 'No se pudieron cargar los gastos.');
      }
    });
  }


  onModelChange(prop: string, value: any): void {
    this.formModel[prop] = value;

    if (prop === 'description') {
      const cat = this.formModel['category'] ?? 'Otros';
      if (!cat || cat === 'Otros') {
        const suggested = this.inferCategory(value || '');
        if (suggested && suggested !== cat) {
          this.formModel['category'] = suggested;
        }
      }
    }
  }

  private inferCategory(text: string): string {
    const t = (text || '').toLowerCase();
    const rules: Record<string, string[]> = {
      'Educación': ['matrícula', 'colegio', 'universidad', 'curso', 'libro', 'taller'],
      'Salud': ['clínica', 'gym', 'médico', 'farmacia', 'dentista', 'psicología'],
      'Alimentación': ['supermercado', 'comida', 'restaurante', 'alimento', 'mercado', 'bebidas'],
      'Transporte': ['pasaje', 'gasolina', 'taxi', 'uber', 'metropolitano', 'peaje'],
      'Vivienda': ['alquiler', 'hipoteca', 'luz', 'agua', 'internet', 'mantenimiento'],
      'Vestimenta': ['ropa', 'zapato', 'pantalon', 'camisa', 'reloj']
    };
    for (const [cat, kws] of Object.entries(rules)) {
      if (kws.some(k => t.includes(k))) return cat;
    }
    return 'Otros';
  }

  onSubmit(form: NgForm): void {
    this.submitted = true;
    if (form.invalid) return;

    const base: Omit<Expense, 'id'> = {
      userId: Number(this.formModel['userId']),
      period: String(this.formModel['period']),
      amount: Number(this.formModel['amount']),
      description: String(this.formModel['description']),
      category: String(this.formModel['category'] || this.inferCategory(this.formModel['description'] || '') || 'Otros')
    };

    const req$ = this.editingId !== null
      ? this.expenseService.updateExpense({ id: this.editingId, ...base })
      : this.expenseService.addExpense(base);

    req$.subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: this.editingId !== null ? 'Gasto actualizado' : 'Gasto creado', timer: 1200, showConfirmButton: false });
        this.clearForm();
        this.loadExpenses();
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar el gasto.' })
    });
  }

  edit(row: Expense): void {
    this.editingId = row.id;
    this.formModel = {
      userId: Number(row.userId),
      period: row.period,
      amount: row.amount,
      description: row.description,
      category: row.category
    };
    this.submitted = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  remove(row: Expense): void {
    Swal.fire({
      title: 'Eliminar gasto',
      text: `¿Seguro que deseas eliminar "${row.description}"? Esta acción no se puede revertir.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;

      const id = row.id; // <- importante

      this.expenseService.deleteExpense(id).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
          if (this.editingId === id) this.clearForm();
          this.loadExpenses();
        },
        error: () => {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el gasto.' });
        }
      });
    });
  }

  clearForm(): void {
    this.editingId = null;
    this.submitted = false;
    const firstUserId = this.users()[0]?.id ?? null;
    this.formModel = { userId: firstUserId, category: 'Otros' };
  }

  back() {
    this.router.navigate(['/dashboard'])
  }

}