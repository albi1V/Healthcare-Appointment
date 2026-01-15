
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

const routes: Routes = [
  // ✅ Default route shows Landing
  { path: '', component: LandingComponent },

  // Auth
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },

  // Feature routes
  { path: 'dashboard', component: DashbaordComponent },
  { path: 'patient-appointment', component: PatientAppointmentComponent },
  { path: 'schedule-appointment', component: ScheduleAppointmentComponent },
  { path: 'doctor-appointment', component: DoctorAppointmentComponent },
  { path: 'doctor-availability', component: DoctorAvailabilityComponent },
  { path: 'receptionist-appointments', component: ReceptionistAppointmentsComponent },
  { path: 'receptionist-schedule-appointments', component: ReceptionistScheduleAppointmentsComponent },

  // ✅ Fallback route → Landing (NOT dashboard)
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
