import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-doctor-availability',
  templateUrl: './doctor-availability.component.html',
  styleUrls: ['./doctor-availability.component.scss']
})
export class DoctorAvailabilityComponent implements OnInit {

  itemForm: FormGroup;
  responseMessage: any;
  isAdded = false;

  // ✅ expose userId safely to template
  doctorId: number | null = null;

  constructor(
    public httpService: HttpService,
    private formBuilder: FormBuilder
  ) {
    this.itemForm = this.formBuilder.group({
      doctorId: ['', Validators.required],
      availability: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const userIdString = localStorage.getItem('userId');
    this.doctorId = userIdString ? parseInt(userIdString, 10) : null;

    if (this.doctorId !== null) {
      this.itemForm.controls['doctorId'].setValue(this.doctorId);
    }
  }

  onSubmit(): void {
    if (this.itemForm.invalid || this.doctorId === null) {
      return;
    }

    const availability = this.itemForm.value.availability;

    this.httpService.updateDoctorAvailability(this.doctorId, availability)
      .subscribe({
        next: () => {
          this.responseMessage = 'Availability updated successfully';
          this.isAdded = true;
          this.itemForm.reset({ doctorId: this.doctorId });
        },
        error: () => {
          this.responseMessage = 'Failed to update availability';
          this.isAdded = false;
        }
      });
  }
}
