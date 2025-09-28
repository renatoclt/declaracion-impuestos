import { Component, inject, input, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@/app/shared/services/auth-service';
import { User } from '@/app/shared/interfaces/user.interface';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-cabecera',
  imports: [],
  templateUrl: './cabecera.html',
})
export class Cabecera  implements OnInit{
    private readonly router = inject(Router);
    currentUser: User | null = null;
    private readonly http = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly API_URL = 'http://localhost:3000';
    @Input() mostrarCebecera: boolean = true;
    @Input() loggedInUser : User | null = null;

    constructor(private readonly authservice :AuthService){}

    ngOnInit(): void {
      //this.loggedInUser = this.authservice.login();
      const requests = {
        users: this.getUsers(),
      }
    }

    logout():void{
      this.authservice.logout();
      this.loggedInUser = null;
    }
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
    this.router.navigate(['/declaration/income']);
  }

  onDeclarationIncome() {
    this.router.navigate(['/declaration/income']);
  }

  onDeclarationExpense() {
    this.router.navigate(['/declaration/expense']);
  }

  onCalculation() {
    this.router.navigate(['/declaration/calculation']);
  }

  onHistory() {
    this.router.navigate(['/declaration/history']);
  }

  viewExpenses() {
    this.router.navigate(['declaration/expense']);
  }

  viewAllHistory() {
    this.router.navigate(['/declarations/history']);
  }

  private getUsers(): Observable<User[]> {
      return this.http.get<User[]>(`${this.API_URL}/users`);
    }

}
