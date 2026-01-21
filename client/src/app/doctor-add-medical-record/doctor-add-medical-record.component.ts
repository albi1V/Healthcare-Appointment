import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from '../../services/http.service';
 
@Component({
  selector: 'app-doctor-add-medical-record',
  templateUrl: './doctor-add-medical-record.component.html',
  styleUrls: ['./doctor-add-medical-record.component.scss']
})
export class DoctorAddMedicalRecordComponent implements OnInit {
 
  itemForm: FormGroup;
  patientId!: number;
  doctorId!: number;
 
  // NEW: names to show next to IDs
  patientUsername: string | null = null;
  doctorUsername: string | null = null;
 
  responseMessage: string = '';
  isAdded: boolean = false;
  isSubmitting: boolean = false;
 
  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.itemForm = this.formBuilder.group({
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      diagnosis: ['', Validators.required],
      treatment: ['', Validators.required]
    });
  }
 
  ngOnInit(): void {
    this.patientId = Number(this.route.snapshot.paramMap.get('patientId'));
    const doctorIdStr = localStorage.getItem('userId');
    this.doctorId = parseInt(doctorIdStr || '0');
 
    console.log('=== ADD MEDICAL RECORD INIT ===');
    console.log('Patient ID:', this.patientId);
    console.log('Doctor ID:', this.doctorId);
 
    this.itemForm.patchValue({
      patientId: this.patientId,
      doctorId: this.doctorId
    });
 
    // Fetch brief names
    this.httpService.getPatientBrief(this.patientId).subscribe({
      next: brief => this.patientUsername = brief?.username ?? null,
      error: _ => this.patientUsername = null
    });
    this.httpService.getDoctorBrief(this.doctorId).subscribe({
      next: brief => this.doctorUsername = brief?.username ?? null,
      error: _ => this.doctorUsername = null
    });
  }
 
  onSubmit() {
    if (this.itemForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      console.log('=== SUBMITTING MEDICAL RECORD ===');
      console.log('Form Data:', this.itemForm.value);
 
      this.httpService.addMedicalRecord(this.itemForm.value).subscribe(
        (data: any) => {
          console.log('=== RECORD ADDED SUCCESSFULLY ===');
          console.log('Response:', data);
 
          this.responseMessage = 'Medical record added successfully!';
          this.isAdded = true;
          this.isSubmitting = false;
 
          this.itemForm.patchValue({ diagnosis: '', treatment: '' });
          this.itemForm.get('diagnosis')?.markAsPristine();
          this.itemForm.get('diagnosis')?.markAsUntouched();
          this.itemForm.get('treatment')?.markAsPristine();
          this.itemForm.get('treatment')?.markAsUntouched();
 
          setTimeout(() => {
            this.responseMessage = '';
            this.isAdded = false;
            this.router.navigate(['/doctor/patient-history', this.patientId], {
              queryParams: { refresh: new Date().getTime() }
            });
          }, 1500);
        },
        (error) => {
          console.error('=== ERROR ADDING RECORD ===');
          console.error('Error:', error);
          this.responseMessage = 'Error adding medical record. Please try again.';
          this.isAdded = false;
          this.isSubmitting = false;
        }
      );
    } else if (!this.itemForm.valid) {
      console.log('=== FORM INVALID ===');
      Object.keys(this.itemForm.controls).forEach(key => {
        this.itemForm.get(key)?.markAsTouched();
      });
    }
  }
 
  cancel() {
    this.router.navigate(['/doctor/patient-history', this.patientId]);
  }
}


/// made some changes