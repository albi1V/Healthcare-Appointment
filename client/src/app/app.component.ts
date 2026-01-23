import { Component, OnInit } from '@angular/core';

import { AuthService } from '../services/auth.service';

import { Router } from '@angular/router';
 
@Component({

  selector: 'app-root',

  templateUrl: './app.component.html',

  styleUrls: ['./app.component.scss']

})

export class AppComponent implements OnInit {

  isLoading = true;

  IsLoggin: any = false;

  roleName: string | null;

  constructor(private authService: AuthService, private router: Router) {

    this.IsLoggin = authService.getLoginStatus;

    this.roleName = authService.getRole;

  }
 
  ngOnInit() {

    // Show loading animation for 2 seconds

    setTimeout(() => {

      this.isLoading = false;

      // Check login status after loading

      if (this.IsLoggin == false) {

        this.router.navigateByUrl('/login');

      }

    }, 2000); // Adjust time as needed (2000ms = 2 seconds)

  }
 
  logout() {

    this.authService.logout();

    window.location.reload();

  }

}
 