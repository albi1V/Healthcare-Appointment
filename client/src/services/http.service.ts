import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders,HttpParams, HttpResponse  } from '@angular/common/http';
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

getAppointmentByDoctor(id: any): Observable<any[]> {
  return this.http.get<any[]>(
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

  sendOtp(data: { email: string }) {
  return this.http.post(
    this.serverName+'/api/password/send-otp',
    data,{ responseType: 'text' }
  );
}
 
verifyOtp(data: { email: string; otp: string }) {
  return this.http.post(
    this.serverName+'/api/password/verify-otp',
    data,
    { responseType: 'text' }
  );
}
 
resetPassword(data: { email: string; newPassword: string }) {
  return this.http.post(
    this.serverName+'/api/password/reset-password',
    data,
    { responseType: 'text' }
  );
}


sendMessage(message: string): Observable<any> {
  return this.http.post(
    this.serverName + '/api/chatbot/chat',
    { message },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

// Delete Appointment
  deleteAppointment(appointmentId: number): Observable<any> {
    return this.http.delete(
      `${this.serverName}/api/receptionist/appointment/${appointmentId}`,
      { headers: this.authHeaders() }
    );
  }


    // ✅ NEW: Recommend Doctor Based on Symptoms
  /**
   * Recommend doctor based on patient symptoms
   * @param symptoms - Patient's symptom description
   * @returns Observable with recommended specialist and available doctors
   */
  recommendDoctor(symptoms: string): Observable<any> {
    return this.http.post(
      `${this.serverName}/api/patient/recommend-doctor`,
      { symptoms },
      { headers: this.authHeaders() }
    );
  }


  // ========================================
 
  // ✅ NEW: DOCTOR PROFILE MANAGEMENT
 
  // ========================================
 
  /**
 
   * Get Doctor Profile by ID
 
   * @param doctorId - The ID of the doctor
 
   * @returns Observable with doctor profile data (DTO)
 
   */
 
  getDoctorProfile(doctorId: any): Observable<any> {
 
    return this.http.get(
 
      `${this.serverName}/api/doctor/profile/full/${doctorId}`,
 
      { headers: this.authHeaders() }
 
    );
 
  }
 
  /**
 
   * Update Doctor Profile
 
   * @param doctorId - The ID of the doctor
 
   * @param profileData - Updated profile data (DTO)
 
   * @returns Observable with success message
 
   */
 
  updateDoctorProfile(doctorId: any, profileData: any): Observable<any> {
 
    return this.http.put(
 
      `${this.serverName}/api/doctor/profile/${doctorId}`,
 
      profileData,
 
      { headers: this.authHeaders() }
 
    );
 
  }


  createAppointmentV2(details: { patientId: number; doctorId: number; time: string }) {

  return this.http.post<any>(

    `${this.serverName}/appointments`,    // your new controller also supports /api/appointments; stick to /appointments

    details,

    { headers: this.authHeaders() }

  );

}

// Get a compact summary of a patient's info (for quick view cards).

  getPatientBrief(patientId: string | number): Observable<any> {

    return this.http.get(`${this.serverName}/api/patient/brief/${patientId}`, {

      headers: this.authHeaders(),

    });

  }
 

  // Get a compact summary of a doctor's info (for quick view cards).
  getDoctorBrief(doctorId: string | number): Observable<any> {
    return this.http.get(`${this.serverName}/api/doctor/brief/${doctorId}`, {
      headers: this.authHeaders(),
    });
  }
 

// Doctor adds a medical record for a patient./////////////////////////////////////
addMedicalRecord(details: {
  patientId: string | number;
  doctorId: string | number;
  diagnosis: string;
  treatment: string;
}): Observable<any> {
  const params = new HttpParams()
    .set('patientId', String(details.patientId))
    .set('doctorId', String(details.doctorId))
    .set('diagnosis', details.diagnosis)
    .set('treatment', details.treatment);

  return this.http.post(`${this.serverName}/api/doctor/medical-record`, {}, {
    headers: this.authHeaders(),
    params,
  });
}


// Doctor views a patient's medical records. Uses path param + anti-cache param.  //////////////////////////////////////

getPatientRecords(patientId: string | number): Observable<any> {
  // optional cache-buster param 't'
  const params = new HttpParams().set('t', String(Date.now()));

  return this.http.get(
    `${this.serverName}/api/doctor/patients/${patientId}/records`,
    {
      headers: this.authHeaders(),
      params,
    }
  );
}



// Search patients by a free-text term.
// Adds 't' (timestamp) to prevent browser/proxy caching of identical queries.
searchPatients(searchTerm: string): Observable<any> {
  const params = new HttpParams()
    .set('searchTerm', searchTerm || '')
    .set('t', String(Date.now()));

  return this.http.get(`${this.serverName}/api/patients/search`, {
    headers: this.authHeaders(),
    params,
  });
}

// Alias for receptionist context; currently same endpoint/behavior.
  searchPatientsByReceptionist(searchTerm: string): Observable<any> {
    return this.searchPatients(searchTerm);
  }

    // Download a generated medical record report (e.g., PDF).
  // Uses observe: 'response' so caller can inspect headers like content-type/filename.
  // responseType: 'blob' ensures binary data is returned.
  downloadMedicalRecordReport(recordId: number | string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.serverName}/api/records/${recordId}/report`, {
      headers: this.authHeaders(),
      observe: 'response',
      responseType: 'blob'
    });
  }


    // Receptionist views a patient's medical records (restricted subset server-side).

getPatientRecordsByReceptionist(patientId: string | number): Observable<any> {
  const params = new HttpParams().set('t', String(Date.now())); // cache-buster
  return this.http.get(
    `${this.serverName}/api/receptionist/patients/${patientId}/records`,
    { headers: this.authHeaders(), params }
  );
}

}
