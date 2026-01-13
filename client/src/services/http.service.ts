import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class HttpService {
  public serverName = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  updateDoctorAvailability(doctorId: any, availability: any) {
    return this.http.post(
      `${this.serverName}/api/doctor/availability?doctorId=${doctorId}&availability=${availability}`,
      {},
      { headers: this.authHeaders() }
    );
  }

  getAllAppointments() {
    return this.http.get(
      `${this.serverName}/api/receptionist/appointments`,
      { headers: this.authHeaders() }
    );
  }

  getAppointmentByDoctor(id: any) {
    return this.http.get(
      `${this.serverName}/api/doctor/appointments?doctorId=${id}`,
      { headers: this.authHeaders() }
    );
  }

  getAppointmentByPatient(id: any) {
    return this.http.get(
      `${this.serverName}/api/patient/appointments?patientId=${id}`,
      { headers: this.authHeaders() }
    );
  }

  ScheduleAppointment(details: any) {
    return this.http.post(
      `${this.serverName}/api/patient/appointment?patientId=${details.patientId}&doctorId=${details.doctorId}`,
      details,
      { headers: this.authHeaders() }
    );
  }

  ScheduleAppointmentByReceptionist(details: any) {
    return this.http.post(
      `${this.serverName}/api/receptionist/appointment?patientId=${details.patientId}&doctorId=${details.doctorId}`,
      details,
      { headers: this.authHeaders() }
    );
  }

  reScheduleAppointment(id: any, formValue: any) {
    return this.http.put(
      `${this.serverName}/api/receptionist/appointment-reschedule/${id}`,
      formValue,
      { headers: this.authHeaders() }
    );
  }

  getDoctors() {
    return this.http.get(
      `${this.serverName}/api/patient/doctors`,
      { headers: this.authHeaders() }
    );
  }

  Login(details: any) {
    return this.http.post(
      `${this.serverName}/api/user/login`,
      details,
      { headers: this.jsonHeaders() }
    );
  }

  registerPatient(details: any) {
    return this.http.post(
      `${this.serverName}/api/patient/register`,
      details,
      { headers: this.jsonHeaders() }
    );
  }

  registerDoctors(details: any) {
    return this.http.post(
      `${this.serverName}/api/doctors/register`,
      details,
      { headers: this.jsonHeaders() }
    );
  }

  registerReceptionist(details: any) {
    return this.http.post(
      `${this.serverName}/api/receptionist/register`,
      details,
      { headers: this.jsonHeaders() }
    );
  }
}
