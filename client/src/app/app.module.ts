import { ApplicationInitStatus, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegistrationComponent } from './registration/registration.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpService } from '../services/http.service';
import { DashbaordComponent } from './dashbaord/dashbaord.component';
import { PatientAppointmentComponent } from './patient-appointment/patient-appointment.component';

import { ScheduleAppointmentComponent } from './schedule-appointment/schedule-appointment.component';

import { DoctorAppointmentComponent } from './doctor-appointment/doctor-appointment.component';
import { DoctorAvailabilityComponent } from './doctor-availability/doctor-availability.component';
import { ReceptionistAppointmentsComponent } from './receptionist-appointments/receptionist-appointments.component';
import { ReceptionistScheduleAppointmentsComponent } from './receptionist-schedule-appointments/receptionist-schedule-appointments.component';
import { AboutComponent } from './about/about.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ChatComponent } from './chat/chat.component';
import { SymptomRecommendationComponent } from './symptom-recommendation/symptom-recommendation.component.';
import { DoctorProfileComponent } from './doctor-profile/doctor-profile.component';
import { DoctorDetailsComponent } from './doctor-details/doctor-details.component';
import { DoctorAddMedicalRecordComponent } from './doctor-add-medical-record/doctor-add-medical-record.component';
import { DoctorPatientHistoryComponent } from './doctor-patient-history/doctor-patient-history.component';
import { DoctorPatientSearchComponent } from './doctor-patient-search/doctor-patient-search.component';
import { ReceptionistPatientRecordsComponent } from './receptionist-patient-records/receptionist-patient-records.component';




@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegistrationComponent,
    DashbaordComponent,
    PatientAppointmentComponent,
    ScheduleAppointmentComponent,
    DoctorAvailabilityComponent,
    DoctorAppointmentComponent,
    ReceptionistAppointmentsComponent,
    ReceptionistScheduleAppointmentsComponent,
    AboutComponent,
    ForgotPasswordComponent,
    ChatComponent,
    SymptomRecommendationComponent, // ✅ ADD THIS LINE
    DoctorProfileComponent,
    DoctorDetailsComponent,
    DoctorAddMedicalRecordComponent,
    DoctorPatientHistoryComponent,
    DoctorPatientSearchComponent,
    ReceptionistPatientRecordsComponent

    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  providers: [HttpService, HttpClientModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
