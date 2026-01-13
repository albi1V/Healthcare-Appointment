import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-doctor-appointment',
  templateUrl: './doctor-appointment.component.html',
  styleUrls: ['./doctor-appointment.component.scss']
})
export class DoctorAppointmentComponent implements OnInit {

  appointmentList: any[] = [];

  constructor(public httpService: HttpService) {}

  ngOnInit(): void {
    this.getAppointments();
  }

  getAppointments(): void {
    const userIdString = localStorage.getItem('userId');
    if (!userIdString) return;

    const userId = parseInt(userIdString, 10);

    this.httpService.getAppointmentByDoctor(userId).subscribe(
       (data: any) => {
        this.appointmentList = data;
      }
    );
  }
}
