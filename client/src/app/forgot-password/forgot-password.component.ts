import { Component } from '@angular/core';
import { HttpService } from '../../services/http.service';
 
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
 
  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';
 
  otpSent = false;
  otpVerified = false;
  loading = false;
 
  constructor(private httpService: HttpService) {}
 
  sendOtp() {
  if (!this.email) {
    alert('Please enter email');
    return;
  }
 
  this.loading = true;
 
  this.httpService.sendOtp({ email: this.email }).subscribe({
    next: (response: any) => {
      this.loading = false;
      this.otpSent = true;
      console.log(this.otpSent);
      // Handle both string and object responses
      const message = typeof response === 'string' ? response : (response.message || 'OTP sent to your email');
      alert(message);
    },
    error: (err) => {
      this.loading = false;
      // Properly extract error message
      let errorMessage = 'Email not registered';
      if (err.error) {
        if (typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.error.message) {
          errorMessage = err.error.message;
        }
      }
      alert(errorMessage);
    }
  });
}
 
verifyOtp() {
  if (!this.otp) {
    alert('Enter OTP');
    return;
  }
 
  this.httpService.verifyOtp({
    email: this.email,
    otp: this.otp
  }).subscribe({
    next: (response: any) => {
      this.otpVerified = true;
      const message = typeof response === 'string' ? response : (response.message || 'OTP verified');
      alert(message);
    },
    error: (err) => {
      let errorMessage = 'Invalid or expired OTP';
      if (err.error) {
        if (typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.error.message) {
          errorMessage = err.error.message;
        }
      }
      alert(errorMessage);
    }
  });
}
 
resetPassword() {
  if (this.newPassword !== this.confirmPassword) {
    alert('Passwords do not match');
    return;
  }
 
  this.httpService.resetPassword({
    email: this.email,
    newPassword: this.newPassword
  }).subscribe({
    next: (response: any) => {
      const message = typeof response === 'string' ? response : (response.message || 'Password updated successfully');
      alert(message);
    },
    error: (err) => {
      let errorMessage = 'Password reset failed';
      if (err.error) {
        if (typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.error.message) {
          errorMessage = err.error.message;
        }
      }
      alert(errorMessage);
    }
  });
}
}