import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';
@Component({
  selector: 'app-patient-appointment',
  templateUrl: './patient-appointment.component.html',
  styleUrls: ['./patient-appointment.component.scss']
})
export class PatientAppointmentComponent implements OnInit {

  // Stores the list of appointments for the patient
  appointmentList: any[] = [];

  // Inject HttpService
  constructor(public httpService: HttpService) {}

  // Lifecycle hook
  ngOnInit(): void {
    this.getAppointments();
  }

  // Fetch appointments for the patient
  getAppointments(): void {
  const userIdString = localStorage.getItem('userId');
  if (!userIdString) return;

  const userId = parseInt(userIdString, 10);

  this.httpService.getAppointmentByPatient(userId).subscribe(
    (data: any) => {
      this.appointmentList = data;
      console.log('Patient appointments:', this.appointmentList);
    },
    (error: any) => {
      console.error('Error fetching appointments', error);
    }
  );
}

}

