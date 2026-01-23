

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
 
@Injectable({
  providedIn: 'root'
})
export class OtpService {
 
  private baseUrl = environment.apiUrl + '/api/otp';
 
  constructor(private http: HttpClient) {}
 
  sendOtp(email: string) {
    return this.http.post(
      `${this.baseUrl}/send?email=${email}`,
      {}
    );
  }
 
  verifyOtp(email: string, otp: string) {
    return this.http.post(
      `${this.baseUrl}/verify?email=${email}&otp=${otp}`,
      {}
    );
  }
}

