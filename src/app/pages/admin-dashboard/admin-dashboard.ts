import { User } from '@/app/shared/interfaces/user.interface';
import { AuthService } from '@/app/shared/services/auth-service';
import { UserService } from '@/app/shared/services/user-service';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, WritableSignal, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { finalize } from 'rxjs';
import { TaxTypeService } from '@/app/shared/services/taxtype-service';
import { TaxType } from '@/app/shared/interfaces/taxtype.interface';
import { MONTH_DATA } from '@/app/shared/data/months';
import { Month } from '@/app/shared/interfaces/month.interface';
import { YEARS_DATA } from '@/app/shared/data/years';
import { DeclarationService } from '@/app/shared/services/declaration-service';
import { PeriodReport, TaxReportService } from '@/app/shared/util/report.declarations';
import { ReportDeclarations } from '@/app/shared/services/report-declarations';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboard implements OnInit {

  private readonly authService: AuthService = inject(AuthService);
  private readonly userService: UserService = inject(UserService);
  private readonly taxTypeService: TaxTypeService = inject(TaxTypeService);
  private readonly declarationService: DeclarationService = inject(DeclarationService);
  private readonly reportDeclaration: ReportDeclarations = inject(ReportDeclarations);

  usersTaxypayers: WritableSignal<User[]> = signal([]);
  allUsers: WritableSignal<User[]> = signal([]);
  allTaxtType: WritableSignal<TaxType[]> = signal([]);
  displayedColumns: WritableSignal<string[]> = signal(['Nombre', 'Usuario', 'Tipo Doc.', 'Número Doc.', 'Correo', 'Dirección', 'Acciones']);
  user: WritableSignal<User | undefined> = signal(undefined);
  formGroupUser: FormGroup = new FormGroup({
    id: new FormControl(''),
    name: new FormControl('', [Validators.required]),
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    documentType: new FormControl('DNI', [Validators.required]),
    documentNumber: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    role: new FormControl('taxpayer'),
  });
  textButton: WritableSignal<string> = signal('Registrar');
  message: WritableSignal<string> = signal('');
  titleModal: WritableSignal<string> = signal('Nuevo');
  errorService: WritableSignal<boolean> = signal(false);
  successService: WritableSignal<boolean> = signal(false);
  errorCallService: WritableSignal<boolean> = signal(false);
  typeInputPass: WritableSignal<string> = signal('password');
  months = signal<Month[]>(MONTH_DATA);
  years = signal<string[]>(YEARS_DATA);
  dateToday = new Date();
  currentYear = String(this.dateToday.getFullYear());
  month = this.dateToday.getMonth() + 1
  currentMonth = this.month < 10 ? '0' + this.month : String(this.month);
  formGroupReport: FormGroup = new FormGroup({
    year: new FormControl(this.currentYear),
    month: new FormControl(this.currentMonth),
  })

  constructor(private readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getTaxtPayers();
    this.getUser();
    this.getTaxttypers();
  }

  getTaxttypers() {
    this.taxTypeService.getTaxType().subscribe({
      next: data => {
        this.allTaxtType.set(data);
      }
    });
  }

  getTaxtPayers() {
    this.userService.getUser().subscribe({
      next: data => {
        this.allUsers.set(data);
        this.usersTaxypayers.set(data.filter(user => user.role !== 'admin'));
      },
      error: () => {
        this.errorCallService.set(true);
        this.cdr.markForCheck();
      }
    }
    );
  }

  getUser() {
    const id = this.authService.getUserId();
    this.userService.getUserById(Number(id)).subscribe(
      data => {
        this.user.set(data);
      }
    );
  }

  logout() {
    this.authService.logout();
  }

  generateNewId(): string {
    const current = this.allUsers();
    if (current.length === 0) { return '1'; }
    const maxId = Math.max(...current.map(u => Number(u.id)));
    return (maxId + 1).toString();
  }

  action(type: string, id?: number) {
    this.titleModal.set(type);
    this.textButton.set(type === 'Nuevo' ? 'Registrar' : 'Actualizar');
    const modalEl = document.getElementById('modalForm');
    if (!modalEl) { return; }
    try {
      const bs = (window as any).bootstrap;
      if (bs?.Modal) {
        const instance = bs.Modal.getInstance(modalEl) ?? new bs.Modal(modalEl);
        instance.show();
        return;
      }
      modalEl.classList.add('show');
      modalEl.setAttribute('aria-hidden', 'false');
      modalEl.style.display = 'block';
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    } catch (e) {
      console.warn('showModal failed:', e);
    }
    if (type === 'Nuevo') {
      this.clearForm();
    } else if (type === 'Editar' && id) {
      this.setDataTaxtpayer(id);
    }
  }

  hideSuccessToast(): void {
    this.successService.set(false);
    this.errorCallService.set(false);
    this.cdr.markForCheck();
  }

  closeModal(): void {
    const modalEl = document.getElementById('modalForm');
    if (!modalEl) { return; }
    try {
      const bs = (window as any).bootstrap;
      if (bs?.Modal) {
        const instance = bs.Modal.getInstance(modalEl) ?? new bs.Modal(modalEl);
        instance.hide();
        return;
      }
      modalEl.classList.remove('show');
      modalEl.setAttribute('aria-hidden', 'true');
      modalEl.style.display = 'none';
      const backdrops = document.getElementsByClassName('modal-backdrop');
      while (backdrops.length) {
        const bd = backdrops[0];
        bd.parentNode?.removeChild(bd);
      }
    } catch (e) {
      console.warn('closeModal failed:', e);
    }
  }

  clearForm(): void {
    this.formGroupUser.reset({
      id: (''),
      name: (''),
      username: (''),
      password: (''),
      documentType: ('DNI'),
      documentNumber: (''),
      email: (''),
      address: (''),
      role: ('taxpayer'),
    });
  }

  deleteTaxtPayer(id: number): void {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.getTaxtPayers();
        this.message.set('Contribuyente eliminado con éxito.');
      },
      error: (err) => {
        console.error('Error deleting user:', err);
      }
    });
  }

  changeTypePass() {
    this.typeInputPass.set(this.typeInputPass() === 'password' ? 'text' : 'password');
  }

  setDataTaxtpayer(id: number): void {
    const user = this.allUsers().find(u => u.id === id);
    if (!user) { return; }
    this.formGroupUser.setValue({
      id: user.id,
      name: user.name,
      username: user.username,
      password: user.password,
      documentType: user.documentType,
      documentNumber: user.documentNumber,
      email: user.email,
      address: user.address,
      role: user.role,
    });
  }

  onAction() {
    if (this.titleModal() === 'Nuevo') {
      this.addTaxtPayer();
    } else if (this.titleModal() === 'Editar') {
      this.editTaxtPayer();
    }
  }

  addTaxtPayer(): void {
    this.errorService.set(false);
    if (this.formGroupUser.value.id == '') {
      this.formGroupUser.value.id = this.generateNewId();
    }
    this.textButton.set('Registrando');
    this.userService.addUser(this.formGroupUser.value).pipe(finalize(() => { this.textButton.set('Registrar') })).subscribe({
      next: () => {
        this.showToastSuccess('Contribuyente registrado con éxito.');
      },
      error: () => {
        this.errorService.set(true);
      }
    });
  }

  editTaxtPayer() {
    this.errorService.set(false);
    this.textButton.set('Actualizando');
    this.userService.updateUser(this.formGroupUser.value).pipe(finalize(() => { this.textButton.set('Actualizar') })).subscribe({
      next: () => {
        this.showToastSuccess('Contribuyente actualizado con éxito.');
      },
      error: () => {
        this.errorService.set(true);
      }
    });
  }

  showToastSuccess(message: string) {
    this.getTaxtPayers();
    this.clearForm();
    this.closeModal();
    this.successService.set(true);
    this.message.set(message);
    this.cdr.markForCheck();
    setTimeout(() => {
      this.successService.set(false);
    }, 5000);
  }

  downloadReport() {
    const year = this.formGroupReport.value.year;
    const month = this.formGroupReport.value.month;
    this.declarationService.getDeclarationsWithUsersAndTaxType().subscribe({
      next: (data) => {
        const report: PeriodReport = TaxReportService.getReportByPeriod(data, year, month);
        this.reportDeclaration.generatePeriodReportPDF(report);
      },
      error: () => {
        this.errorCallService.set(true);
        setTimeout(() => {
          this.errorCallService.set(false);
        }, 5000);
      }
    });
  }

}
