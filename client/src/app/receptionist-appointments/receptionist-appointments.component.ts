import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-receptionist-appointments',
  templateUrl: './receptionist-appointments.component.html',
  styleUrls: ['./receptionist-appointments.component.scss'],
  providers: [DatePipe]
})
export class ReceptionistAppointmentsComponent implements OnInit {

  itemForm: FormGroup;
  responseMessage: any;
  appointmentList: any[] = [];
  isAdded = false;

  constructor(
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.itemForm = this.formBuilder.group({
      id: ['', Validators.required],
      time: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.getAppointments();
  }

  getAppointments(): void {
    this.httpService.getAllAppointments().subscribe(
      (data: any) => {
        this.appointmentList = data;
      },
      (error: any) => {
        console.error('Error fetching appointments', error);
      }
    );
  }

  editAppointment(val: any): void {
    this.itemForm.controls['id'].setValue(val.id);
    this.isAdded = true;
  }

  onSubmit(): void {
    if (this.itemForm.invalid) return;

    const formattedTime = this.datePipe.transform(
      this.itemForm.controls['time'].value,
      'yyyy-MM-dd HH:mm:ss'
    );

    const appointmentId = this.itemForm.controls['id'].value;

    const formValue = {
      time: formattedTime
    };

    this.httpService.reScheduleAppointment(appointmentId, formValue).subscribe(
      () => {
        this.responseMessage = 'Appointment Rescheduled Successfully';
        this.isAdded = false;
        this.itemForm.reset();
        this.getAppointments();
      },
      () => {
        this.responseMessage = 'Failed to reschedule appointment';
      }
    );
  }
}
