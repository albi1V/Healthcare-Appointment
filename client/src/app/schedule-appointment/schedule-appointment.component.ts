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

  responseMessage: string = '';   // ✅ FIX: never null
  isAdded: boolean = false;

  patientId: number | null = null;

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
    // Read localStorage ONLY in TS
    const userIdString = localStorage.getItem('userId');
    this.patientId = userIdString ? parseInt(userIdString, 10) : null;

    if (this.patientId !== null) {
      this.itemForm.controls['patientId'].setValue(this.patientId);
    }

    this.getDoctors();
  }

  getDoctors(): void {
    this.httpService.getDoctors().subscribe(
      (data: any) => {
        this.doctorList = data as any[]; // ✅ FIX: explicit cast
      },
      (err: any) => {
        console.error('Error fetching doctors', err);
      }
    );
  }

  addAppointment(val: any): void {
    this.itemForm.controls['doctorId'].setValue(val.id);
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

        // Restore patientId after reset
        if (this.patientId !== null) {
          this.itemForm.controls['patientId'].setValue(this.patientId);
        }
      },
      () => {
        this.responseMessage = 'Failed to save appointment';
      }
    );
  }
}
