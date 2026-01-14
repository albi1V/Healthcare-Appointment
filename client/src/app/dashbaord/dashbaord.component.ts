import { Component } from '@angular/core';
import { Router } from '@angular/router';
 
@Component({
  selector: 'app-dashbaord',
  templateUrl: './dashbaord.component.html',
  styleUrls: ['./dashbaord.component.scss']
})
export class DashbaordComponent {
  constructor(private router: Router) {}
 
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
 
  goToRegister(): void {
    this.router.navigate(['/registration']);
  }

 
}