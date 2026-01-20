
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
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

const routes: Routes = [
  // ✅ Default route shows Landing
  { path: '', component: LandingComponent },

  // Auth
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },

  // Feature routes
  { path: 'dashboard', component: DashbaordComponent },
  { path: 'about', component: AboutComponent},
  { path: 'patient-appointment', component: PatientAppointmentComponent },
  { path: 'schedule-appointment', component: ScheduleAppointmentComponent },
  { path: 'doctor-appointment', component: DoctorAppointmentComponent },
  { path: 'doctor-availability', component: DoctorAvailabilityComponent },
  { path: 'receptionist-appointments', component: ReceptionistAppointmentsComponent },
  { path: 'receptionist-schedule-appointments', component: ReceptionistScheduleAppointmentsComponent },
  {path:'forgot-password',component:ForgotPasswordComponent},
  {path:'chat',component:ChatComponent},
    // ✅ NEW: Symptom-based Doctor Recommendation
  { path: 'recommend-doctor', component: SymptomRecommendationComponent },

  // ✅ Fallback route → Landing (NOT dashboard)
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
