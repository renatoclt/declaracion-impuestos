import { User } from '@/app/shared/Interfaces/user.interface';
import { UserService } from '@/app/shared/services/user-service';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';

@Component({
  selector: 'app-user-dashboard',
  imports: [],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDashboard {
  users : User[] = [];
  constructor(private userService: UserService, private cdr: ChangeDetectorRef){}
  ngOnInit(): void {
    this.userService.getUser().subscribe(
      data => {
        this.users = data;
        this.cdr.markForCheck(); 
        console.log(this.users);
      }
    );
  }
}
