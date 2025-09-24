import { Component, input, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@/app/shared/services/auth-service';
import { User } from '@/app/shared/interfaces/user.interface';


@Component({
  selector: 'app-cabecera',
  imports: [RouterLink],
  templateUrl: './cabecera.html',
})
export class Cabecera  implements OnInit{
    
    @Input() mostrarCebecera: boolean = true;
    @Input() loggedInUser : User | null = null;

    constructor(private readonly authservice :AuthService){}

    ngOnInit(): void {
      //this.loggedInUser = this.authservice.login();
    }

    logout():void{
      this.authservice.logout();
      this.loggedInUser = null;
    }

}
