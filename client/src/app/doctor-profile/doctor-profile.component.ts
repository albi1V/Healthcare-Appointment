import { Component, OnInit } from '@angular/core';
 
import { HttpService } from '../../services/http.service';
 
@Component({
 
  selector: 'app-doctor-profile',
 
  templateUrl: './doctor-profile.component.html',
 
  styleUrls: ['./doctor-profile.component.scss']
 
})
 
export class DoctorProfileComponent implements OnInit {
 
  isEditMode = false;
 
  doctor: any = {};
 
  backup: any = {};
 
  loading = false;
 
  errorMessage = '';
 
  constructor(private http: HttpService) {}
 
  ngOnInit() {
 
    this.loadDoctorProfile();
 
  }
 
  /**
 
   * Load doctor profile from database
 
   */
 
  loadDoctorProfile() {
 
    const doctorId = localStorage.getItem('userId');
 
    console.log('🔍 Attempting to load profile for doctorId:', doctorId);
 
    if (!doctorId) {
 
      this.errorMessage = 'Doctor ID not found. Please log in again.';
 
      console.error('❌ No userId in localStorage');
 
      return;
 
    }
 
    this.loading = true;
 
    this.http.getDoctorProfile(doctorId).subscribe({
 
      next: (response) => {
 
        console.log('✅ Profile loaded successfully:', response);
 
        this.doctor = response;
 
        this.backup = { ...response };
 
        this.loading = false;
 
      },
 
      error: (error) => {
 
        console.error('❌ Error loading profile:', error);
 
        console.error('❌ Error status:', error.status);
 
        console.error('❌ Error message:', error.message);
 
        this.errorMessage = 'Failed to load profile. Please try again.';
 
        this.loading = false;
 
      }
 
    });
 
  }
 
  /**
 
   * Enable edit mode
 
   */
 
  enableEdit() {
 
    this.isEditMode = true;
 
    this.errorMessage = '';
 
  }
 
  /**
 
   * Cancel editing and restore original data
 
   */
 
  cancel() {
 
    this.doctor = { ...this.backup };
 
    this.isEditMode = false;
 
    this.errorMessage = '';
 
  }
 
  /**
 
   * Save changes to database
 
   */
 
  save() {
 
    const doctorId = localStorage.getItem('userId');
 
    console.log('💾 Attempting to save profile for doctorId:', doctorId);
 
    if (!doctorId) {
 
      this.errorMessage = 'Doctor ID not found. Please log in again.';
 
      console.error('❌ No userId in localStorage');
 
      return;
 
    }
 
    this.loading = true;
 
    this.errorMessage = '';
 
    this.http.updateDoctorProfile(doctorId, this.doctor).subscribe({
 
      next: (response) => {
 
        console.log('✅ Profile updated successfully:', response);
 
        alert('Profile updated successfully! ✅');
 
        this.isEditMode = false;
 
        this.backup = { ...this.doctor };
 
        this.loading = false;
 
      },
 
      error: (error) => {
 
        console.error('❌ Error updating profile:', error);
 
        console.error('❌ Error status:', error.status);
 
        console.error('❌ Error message:', error.message);
 
        this.errorMessage = 'Failed to update profile. Please try again.';
 
        this.loading = false;
 
      }
 
    });
 
  }
 
}

 