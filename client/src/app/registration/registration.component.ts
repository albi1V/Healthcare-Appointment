
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { OtpService } from '../../services/otp.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit {
  itemForm: FormGroup;
  // You can remove formModel if not used elsewhere
  formModel: any = { role: null, email: '', password: '', username: '' };
  showMessage = false;
  responseMessage: string | null = null;
  showOtpSection = false;
  emailVerified = false;

  constructor(
    public router: Router,
    private bookService: HttpService,
    private formBuilder: FormBuilder,
    private otpService: OtpService
  ) {
    this.itemForm = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      // strong password validator added
      password: ['', [Validators.required, this.strongPasswordValidator.bind(this)]],
      role: ['', Validators.required],
      specialty: [''],
      availability: [''],
      otp: [''] // will be made required dynamically when OTP is shown
    });
  }

  ngOnInit(): void {
    this.itemForm.get('role')?.valueChanges.subscribe(role => {
      this.applyRoleValidators(role);
    });
  }

  // Helper for template (strict-mode friendly with bracket access)
  get f() {
    return this.itemForm.controls;
  }

  private applyRoleValidators(role: string): void {
    if (role === 'DOCTOR') {
      this.itemForm.get('specialty')?.setValidators([Validators.required]);
      this.itemForm.get('availability')?.setValidators([Validators.required]);
    } else {
      this.itemForm.get('specialty')?.clearValidators();
      this.itemForm.get('availability')?.clearValidators();
    }

    this.itemForm.get('specialty')?.updateValueAndValidity();
    this.itemForm.get('availability')?.updateValueAndValidity();
  }

  // Strong password validator
  private strongPasswordValidator(control: AbstractControl) {
    const value: string = control.value || '';
    if (!value) return null; // 'required' handles empties

    const pattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,}$/;

    return pattern.test(value)
      ? null
      : {
          strongPassword: {
            message:
              'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'
          }
        };
  }

  // Live password checks for green/red hints
  get passwordValue(): string {
    return (this.itemForm.get('password')?.value || '') as string;
  }

  get passwordChecks() {
    const v = this.passwordValue;
    return {
      length: v.length >= 8,
      lower: /[a-z]/.test(v),
      upper: /[A-Z]/.test(v),
      number: /\d/.test(v),
      special: /[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(v)
    };
  }

  onRegister(): void {
    if (!this.emailVerified) {
      alert('Please verify your email before registering');
      return;
    }

    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    // Normalize username (matches backend normalization)
    const normalized = (this.itemForm.value.username || '').trim().toLowerCase();
    this.itemForm.patchValue({ username: normalized });

    let registerCall;
    switch (this.itemForm.value.role) {
      case 'PATIENT':
        registerCall = this.bookService.registerPatient(this.itemForm.value);
        break;
      case 'DOCTOR':
        registerCall = this.bookService.registerDoctors(this.itemForm.value);
        break;
      case 'RECEPTIONIST':
        registerCall = this.bookService.registerReceptionist(this.itemForm.value);
        break;
      default:
        return;
    }

    registerCall.subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'You are successfully Registered';
        this.itemForm.reset();
        this.emailVerified = false;
        this.showOtpSection = false;
      },
      error: (err) => {
        this.showMessage = true;

        if (err?.status === 409) {
          this.responseMessage = err.error?.error || 'Username already exists. Please choose another.';
        } else if (err?.status === 400) {
          this.responseMessage = err.error?.error || 'Invalid input. Please check the form.';
        } else {
          this.responseMessage = 'Registration failed. Please try again.';
        }
      }
    });
  }

  onVerifyEmail(): void {
    const email = this.itemForm.get('email')?.value;

    if (!email) {
      alert('Please enter email');
      return;
    }

    this.otpService.sendOtp(email).subscribe({
      next: () => {
        this.showOtpSection = true;

        // ✅ Make OTP required when OTP flow is visible
        this.itemForm.get('otp')?.setValidators([Validators.required]);
        this.itemForm.get('otp')?.updateValueAndValidity();

        alert('OTP sent to your email');
      },
      error: () => alert('Failed to send OTP')
    });
  }

  verifyOtp(): void {
    const email = this.itemForm.get('email')?.value;
    const otp = this.itemForm.get('otp')?.value;

    this.otpService.verifyOtp(email, (otp || '').trim()).subscribe({
      next: () => {
        this.emailVerified = true;
        this.showOtpSection = false;

        // ✅ Clear OTP validator after success
        this.itemForm.get('otp')?.clearValidators();
        this.itemForm.get('otp')?.updateValueAndValidity();

        // Optional: lock email field after verification
        // this.itemForm.get('email')?.disable();

        alert('Email verified successfully');
      },
      error: () => alert('Invalid OTP')
    });
  }
}



