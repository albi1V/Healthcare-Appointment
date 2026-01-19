import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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

  formModel: any = { role: null, email: '', password: '', username: '' };

  showMessage: boolean = false;

  responseMessage: any;

  showOtpSection = false;

  emailVerified = false;

  // otp: string = '';

  // otpSent = false;

  // otpVerified = false;
 
 
  constructor(

    public router: Router,

    private bookService: HttpService,

    private formBuilder: FormBuilder,

    private otpService:OtpService

  ) {

    this.itemForm = this.formBuilder.group({

      username: ['', Validators.required],

      email: ['', [Validators.required, Validators.email]],

      password: ['', Validators.required],

      role: ['', Validators.required],

      specialty: [''],

      availability: [''],

      otp:['']

    });

  }
 
  ngOnInit(): void {

    this.itemForm.get('role')?.valueChanges.subscribe(role => {

      this.applyRoleValidators(role);

    });

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
 
  
onRegister(): void {

  if (!this.emailVerified) {
    alert('Please verify your email before registering');
    return;
  }

  if (this.itemForm.invalid) {
    this.itemForm.markAllAsTouched();
    return;
  }

  // Optional: normalize username on client too (matches backend behavior)
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

      alert('OTP sent to your email');

    },

    error: () => alert('Failed to send OTP')

  });

}
 
verifyOtp(): void {

  const email = this.itemForm.get('email')?.value;

  const otp = this.itemForm.get('otp')?.value;
 
  this.otpService.verifyOtp(email, otp.trim()).subscribe({

    next: () => {

      this.emailVerified = true;

      this.showOtpSection = false;

      // this.itemForm.get('email')?.disable(); // optional UX improvement

      alert('Email verified successfully');

    },

    error: () => alert('Invalid OTP')

  });

}
 
 
}

 