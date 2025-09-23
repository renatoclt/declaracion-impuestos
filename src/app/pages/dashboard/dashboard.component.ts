import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
  documentType: string;
  documentNumber: string;
  address?: string;
}

interface TaxType {
  id: number;
  name: string;
  description: string;
  rate: number;
}

interface Declaration {
  id: number;
  userId: number;
  period: string;
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  taxAmount: number;
  status: 'pending' | 'completed' | 'draft';
  taxTypeId: number;
  receiptUrl?: string;
}

interface Income {
  id: number;
  userId: number;
  source: string;
  amount: number;
  period: string;
  description: string;
}

interface Expense {
  id: number;
  userId: number;
  category: string;
  amount: number;
  period: string;
  description: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);

  // Base URL del JSON Server
  private readonly API_URL = 'http://localhost:3000';

  // Propiedades para los datos
  users: User[] = [];
  taxTypes: TaxType[] = [];
  incomes: Income[] = [];
  expenses: Expense[] = [];
  declarations: Declaration[] = [];

  // Usuario actual (simulado - en producción vendría del servicio de auth)
  currentUser: User | null = null;
  allDeclarations: Declaration[] = [];
  pendingDeclarations: Declaration[] = [];
  completedDeclarations: Declaration[] = [];
  recentDeclarations: Declaration[] = [];
  totalTaxesPaid = 0;
  currentPeriodIncome = 0;

  // Estados de carga
  isLoading = true;
  hasError = false;
  errorMessage = '';

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.isLoading = true;
    this.hasError = false;

    // Cargar todos los datos en paralelo
    const requests = {
      users: this.getUsers(),
      taxTypes: this.getTaxTypes(),
      incomes: this.getIncomes(),
      expenses: this.getExpenses(),
      declarations: this.getDeclarations()
    };

    forkJoin(requests).subscribe({
      next: (data) => {
        this.users = data.users;
        this.taxTypes = data.taxTypes;
        this.incomes = data.incomes;
        this.expenses = data.expenses;
        this.declarations = data.declarations;

        // Simular usuario logueado (primer usuario por defecto)
        this.currentUser = this.users[0] || null;

        this.processDashboardData();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar datos del dashboard:', error);
        this.hasError = true;
        this.errorMessage = 'Error al cargar los datos. Asegúrate de que el JSON Server esté ejecutándose.';
        this.isLoading = false;
      }
    });
  }

  // Métodos para obtener datos de la API
  private getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users`);
  }

  private getTaxTypes(): Observable<TaxType[]> {
    return this.http.get<TaxType[]>(`${this.API_URL}/taxTypes`);
  }

  private getIncomes(): Observable<Income[]> {
    return this.http.get<Income[]>(`${this.API_URL}/incomes`);
  }

  private getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.API_URL}/expenses`);
  }

  private getDeclarations(): Observable<Declaration[]> {
    return this.http.get<Declaration[]>(`${this.API_URL}/declarations`);
  }

  // Obtener declaraciones por usuario
  private getDeclarationsByUserId(userId: number): Observable<Declaration[]> {
    return this.http.get<Declaration[]>(`${this.API_URL}/declarations?userId=${userId}`);
  }

  // Obtener ingresos por usuario y período
  private getIncomesByUserAndPeriod(userId: number, period: string): Observable<Income[]> {
    return this.http.get<Income[]>(`${this.API_URL}/incomes?userId=${userId}&period=${period}`);
  }

  private processDashboardData() {
    if (!this.currentUser) return;

    // Filtrar declaraciones del usuario actual
    this.allDeclarations = this.declarations.filter(d => d.userId === this.currentUser!.id);

    // Separar por estado
    this.pendingDeclarations = this.allDeclarations.filter(d => d.status === 'pending');
    this.completedDeclarations = this.allDeclarations.filter(d => d.status === 'completed');

    // Mostrar las más recientes en el historial (máximo 5)
    this.recentDeclarations = [...this.allDeclarations]
      .sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime())
      .slice(0, 5);

    // Calcular totales
    this.totalTaxesPaid = this.completedDeclarations.reduce((sum, d) => sum + d.taxAmount, 0);

    // Ingresos del período actual
    const currentPeriod = "2025-01";
    this.currentPeriodIncome = this.incomes
      .filter(i => i.userId === this.currentUser!.id && i.period === currentPeriod)
      .reduce((sum, i) => sum + i.amount, 0);
  }

  getTaxTypeName(taxTypeId: number): string {
    const taxType = this.taxTypes.find(t => t.id === taxTypeId);
    return taxType ? taxType.name : 'Desconocido';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'draft': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Completada';
      case 'pending': return 'Pendiente';
      case 'draft': return 'Borrador';
      default: return 'Desconocido';
    }
  }

  // Métodos de navegación
  createNewDeclaration() {
    this.router.navigate(['/declarations/new']);
  }

  editDeclaration(id: number) {
    this.router.navigate(['/declarations/edit', id]);
  }

  viewDeclaration(id: number) {
    this.router.navigate(['/declarations/view', id]);
  }

  viewIncomes() {
    this.router.navigate(['/incomes']);
  }

  viewExpenses() {
    this.router.navigate(['/expenses']);
  }

  viewAllHistory() {
    this.router.navigate(['/declarations/history']);
  }

  downloadReports() {
    // Implementar descarga de reportes
    console.log('Descargando reportes...');
    // Podrías hacer una llamada a un endpoint para generar reportes
    // this.http.get(`${this.API_URL}/reports/generate/${this.currentUser?.id}`).subscribe(...)
  }

  downloadReceipt(url: string) {
    window.open(url, '_blank');
  }

  // Método para refrescar los datos
  refreshData() {
    this.loadDashboardData();
  }

  // Método para cambiar de usuario (útil para testing)
  switchUser(userId: number) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.currentUser = user;
      this.processDashboardData();
    }
  }

  // Métodos adicionales para operaciones CRUD si necesitas

  // Crear nueva declaración
  createDeclaration(declaration: Omit<Declaration, 'id'>): Observable<Declaration> {
    return this.http.post<Declaration>(`${this.API_URL}/declarations`, declaration);
  }

  // Actualizar declaración
  updateDeclaration(id: number, declaration: Partial<Declaration>): Observable<Declaration> {
    return this.http.patch<Declaration>(`${this.API_URL}/declarations/${id}`, declaration);
  }

  // Eliminar declaración
  deleteDeclaration(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/declarations/${id}`);
  }
}