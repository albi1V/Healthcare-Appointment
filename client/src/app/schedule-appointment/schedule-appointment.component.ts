import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-schedule-appointment',
  templateUrl: './schedule-appointment.component.html',
  styleUrls: ['./schedule-appointment.component.scss'],
  providers: [DatePipe]
})
export class ScheduleAppointmentComponent implements OnInit {

  doctorList: any[] = [];
  itemForm: FormGroup;
  responseMessage: any;
  isAdded = false;

  constructor(
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.itemForm = this.formBuilder.group({
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      time: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.getPatients();
  }

  getPatients(): void {
    this.httpService.getDoctors().subscribe(
      (data: any) => {
        this.doctorList = data;
      },
      (err: any) => {
        console.error('Error fetching doctors', err);
      }
    );
  }

  addAppointment(val: any): void {
    const userIdString = localStorage.getItem('userId');
    const userId = userIdString ? parseInt(userIdString, 10) : null;

    this.itemForm.controls['doctorId'].setValue(val.id);
    this.itemForm.controls['patientId'].setValue(userId);
    this.isAdded = true;
  }

  onSubmit(): void {
    if (this.itemForm.invalid) return;

    const formattedTime = this.datePipe.transform(
      this.itemForm.controls['time'].value,
      'yyyy-MM-dd HH:mm:ss'
    );

    const formValue = {
      ...this.itemForm.value,
      time: formattedTime
    };

    this.httpService.ScheduleAppointment(formValue).subscribe(
      () => {
        this.responseMessage = 'Appointment saved successfully';
        this.isAdded = false;
        this.itemForm.reset();
      },
      () => {
        this.responseMessage = 'Failed to save appointment';
      }
    );
  }
}
