
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  itemForm: FormGroup;
  showError: boolean = false;
  errorMessage: string = '';

  constructor(
    public router: Router,
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.itemForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],   // CHANGED
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void { }

  onLogin(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    this.showError = false;

    const payload = {
      email: (this.itemForm.value.email || '').trim().toLowerCase(), // CHANGED
      password: this.itemForm.value.password
    };

    this.httpService.Login(payload).subscribe({
      next: (res: any) => {
        // Backend returns: token, userId, username, email, role
        this.authService.saveToken(res.token);
        this.authService.saveUserId(String(res.userId));
        this.authService.SetRole(res.role);

        // Keep username for UI if needed
        localStorage.setItem('username', res.username);
        localStorage.setItem('email', res.email);

        this.router.navigateByUrl('/dashboard').then(() => {
          setTimeout(() => window.location.reload(), 200);
        });
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Invalid email or password'; // CHANGED
      }
    });
  }

  registration(): void {
    this.router.navigateByUrl('/registration');
  }
}
