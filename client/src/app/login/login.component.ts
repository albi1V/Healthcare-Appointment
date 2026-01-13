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
  formModel: any = {};
  showError: boolean = false;
  errorMessage: any;

  constructor(
    public router: Router,
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.itemForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // intentionally empty
  }

  onLogin(): void {
    if (this.itemForm.invalid) {
      return;
    }

    this.showError = false;

    this.httpService.Login(this.itemForm.value).subscribe({
      next: (res: any) => {
        // expected response: { token, userId, role }
        this.authService.saveToken(res.token);
        this.authService.saveUserId(res.userId);
        this.authService.SetRole(res.role);

        this.router.navigateByUrl('/dashboard').then(() => {
          setTimeout(() => window.location.reload(), 200);
        });
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Invalid username or password';
      }
    });
  }

  registration(): void {
    this.router.navigateByUrl('/registration');
  }
}
