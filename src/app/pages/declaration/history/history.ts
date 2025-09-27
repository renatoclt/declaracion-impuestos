import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth-service';

interface User {
  id: number | string;
  username: string;
  name: string;
  email: string;
  role: string;
  documentType: string;
  documentNumber: string;
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

@Component({
  selector: 'app-history',
  imports: [CommonModule, FormsModule],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API_URL = 'http://localhost:3000';

  declarations: Declaration[] = [];
  filteredDeclarations: Declaration[] = [];
  taxTypes: TaxType[] = [];
  currentUser: User | null = null;

  isLoading = true;
  hasError = false;
  errorMessage = '';

  filterStatus = '';
  filterPeriod = '';
  filterTaxType = '';
  searchTerm = '';

  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  totalDeclarations = 0;
  totalTaxesPaid = 0;
  avgTaxAmount = 0;
  pendingCount = 0;
  completedCount = 0;

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.isLoading = true;
    this.hasError = false;

    // Verificar si el usuario está autenticado
    if (!this.authService.isLoggedIn()) {
      this.handleAuthError();
      return;
    }

    // Obtener el usuario actual desde el AuthService
    this.loadCurrentUser();
  }

  private loadCurrentUser() {
    const loggedUserId = this.authService.getUserId();

    if (!loggedUserId) {
      this.handleAuthError();
      return;
    }

    this.http.get<User>(`${this.API_URL}/users/${loggedUserId}`).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadDeclarations(Number(loggedUserId));
      },
      error: (error) => {
        // Si falla la carga del usuario específico, intentar buscar en todos los usuarios
        this.loadUserFromAll(loggedUserId);
      }
    });
  }

  private loadUserFromAll(userId: string) {
    this.http.get<User[]>(`${this.API_URL}/users`).subscribe({
      next: (users) => {
        this.currentUser = users?.find(u => u.id.toString() === userId.toString()) || null;

        if (this.currentUser) {
          this.loadDeclarations(Number(userId));
        } else {
          this.handleAuthError();
        }
      },
      error: (error) => {
        this.handleAuthError();
      }
    });
  }

  private getLoggedUserId(): string | number | null {
    // Opción 1: Desde localStorage
    const userFromStorage = localStorage.getItem('currentUser');
    if (userFromStorage) {
      try {
        const user = JSON.parse(userFromStorage);
        return user.id;
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }

    // Opción 2: Desde sessionStorage
    const userFromSession = sessionStorage.getItem('currentUser');
    if (userFromSession) {
      try {
        const user = JSON.parse(userFromSession);
        return user.id;
      } catch (e) {
        console.error('Error parsing user from sessionStorage:', e);
      }
    }

    // Opción 3: Desde un servicio de autenticación (ejemplo)
    // return this.authService.getCurrentUserId();

    // Si no se encuentra usuario logueado, retornar null
    return null;
  }

  private handleAuthError() {
    this.hasError = true;
    this.isLoading = false;
    this.errorMessage = 'No se pudo identificar el usuario logueado. Por favor, inicie sesión nuevamente.';

    // Redirigir al login después de 2 segundos
    setTimeout(() => {
      this.authService.logout();
    }, 2000);
  }

  private loadDeclarations(userId: number) {
    const url = `${this.API_URL}/declarations?userId=${userId}`;

    this.http.get<Declaration[]>(url).subscribe({
      next: (declarations) => {
        this.declarations = declarations || [];
        this.loadTaxTypes();
      },
      error: (error) => {
        this.loadAllDeclarationsFiltered(userId);
      }
    });
  }

  private loadAllDeclarationsFiltered(userId: number) {
    this.http.get<Declaration[]>(`${this.API_URL}/declarations`).subscribe({
      next: (declarations) => {
        // Filtrar solo las declaraciones del usuario logueado
        this.declarations = declarations?.filter(d => d.userId === userId) || [];
        this.loadTaxTypes();
      },
      error: (error) => {
        this.handleLoadError(error);
      }
    });
  }

  private loadTaxTypes() {
    this.http.get<TaxType[]>(`${this.API_URL}/taxTypes`).subscribe({
      next: (taxTypes) => {
        this.taxTypes = taxTypes || [];
        this.finishLoading();
      },
      error: (error) => {
        this.handleLoadError(error);
      }
    });
  }

  private finishLoading() {
    this.calculateStatistics();
    this.applyFilters();
    this.isLoading = false;
  }

  private handleLoadError(error: any) {
    this.hasError = true;
    this.isLoading = false;

    if (error.status === 0) {
      this.errorMessage = 'No se puede conectar al servidor. Verifique que JSON Server esté ejecutándose.';
    } else if (error.status === 404) {
      this.errorMessage = 'Endpoint no encontrado. Verifique la configuración del servidor.';
    } else {
      this.errorMessage = `Error del servidor: ${error.status}`;
    }
  }

  private calculateStatistics() {
    this.totalDeclarations = this.declarations.length;
    this.totalTaxesPaid = this.declarations
      .filter(d => d.status === 'completed')
      .reduce((sum, d) => sum + d.taxAmount, 0);

    this.avgTaxAmount = this.totalDeclarations > 0 ?
      this.declarations.reduce((sum, d) => sum + d.taxAmount, 0) / this.totalDeclarations : 0;

    this.pendingCount = this.declarations.filter(d => d.status === 'pending').length;
    this.completedCount = this.declarations.filter(d => d.status === 'completed').length;
  }

  applyFilters() {
    let filtered = [...this.declarations];

    if (this.filterStatus) {
      filtered = filtered.filter(d => d.status === this.filterStatus);
    }

    if (this.filterPeriod) {
      filtered = filtered.filter(d => d.period === this.filterPeriod);
    }

    if (this.filterTaxType) {
      filtered = filtered.filter(d => d.taxTypeId.toString() === this.filterTaxType);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.period.toLowerCase().includes(term) ||
        this.getTaxTypeName(d.taxTypeId).toLowerCase().includes(term) ||
        this.getStatusText(d.status).toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());

    this.filteredDeclarations = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  clearFilters() {
    this.filterStatus = '';
    this.filterPeriod = '';
    this.filterTaxType = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  getPaginatedDeclarations() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredDeclarations.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getPages(): number[] {
    const totalPages = this.getTotalPages();
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getTaxTypeName(taxTypeId: number): string {
    const taxType = this.taxTypes.find(t => t.id === taxTypeId);
    return taxType ? taxType.name : 'Desconocido';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'pending': return 'bg-warning text-dark';
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

  getUniquePeriodsFromDeclarations(): string[] {
    const periods = [...new Set(this.declarations.map(d => d.period))];
    return periods.sort().reverse();
  }

  viewDeclaration(id: number) {
    this.router.navigate(['/declaration/view', id]);
  }

  editDeclaration(id: number) {
    this.router.navigate(['/declaration/edit', id]);
  }

  downloadReceipt(url: string) {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('No hay comprobante disponible para esta declaración');
    }
  }

  deleteDeclaration(id: number) {
    const declaration = this.declarations.find(d => d.id === id);
    if (!declaration) return;

    const confirmMessage = `¿Estás seguro de eliminar la declaración del período ${declaration.period}?`;

    if (confirm(confirmMessage)) {
      this.http.delete(`${this.API_URL}/declarations/${id}`).subscribe({
        next: () => {
          this.declarations = this.declarations.filter(d => d.id !== id);
          this.calculateStatistics();
          this.applyFilters();
        },
        error: (error) => {
          alert('Error al eliminar la declaración');
        }
      });
    }
  }

  exportToCSV() {
    const headers = ['Período', 'Tipo Impuesto', 'Ingresos', 'Gastos', 'Base Imponible', 'Impuesto', 'Estado'];
    const data = this.filteredDeclarations.map(d => [
      d.period,
      this.getTaxTypeName(d.taxTypeId),
      d.totalIncome.toFixed(2),
      d.totalExpenses.toFixed(2),
      d.taxableIncome.toFixed(2),
      d.taxAmount.toFixed(2),
      this.getStatusText(d.status)
    ]);

    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial-declaraciones-${new Date().getTime()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  refreshData() {
    this.loadData();
  }

  testConnection() {
    this.http.get(`${this.API_URL}/users`).subscribe({
      next: () => {
        alert('Conexión exitosa con JSON Server');
      },
      error: () => {
        alert('Error de conexión. Verifique que JSON Server esté ejecutándose.');
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  get showingStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get showingEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  getShowingRange(): { start: number; end: number; total: number } {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return { start, end, total: this.totalItems };
  }
}