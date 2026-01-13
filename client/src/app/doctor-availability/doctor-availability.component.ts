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
  formModel: any = {};
  responseMessage: any;
  isAdded: boolean = false;

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
    // intentionally empty as per problem statement
  }

  onSubmit(): void {
    if (this.itemForm.invalid) {
      return;
    }

    const userIdString = localStorage.getItem('userId');
    if (!userIdString) {
      return;
    }

    const doctorId = parseInt(userIdString, 10);

    // set doctorId into form
    this.itemForm.controls['doctorId'].setValue(doctorId);

    const availability = this.itemForm.controls['availability'].value;

    this.httpService.updateDoctorAvailability(doctorId, availability)
      .subscribe({
        next: () => {
          this.responseMessage = 'Availability updated successfully';
          this.isAdded = true;
          this.itemForm.reset();
        },
        error: () => {
          this.responseMessage = 'Failed to update availability';
          this.isAdded = false;
        }
      });
  }
}
