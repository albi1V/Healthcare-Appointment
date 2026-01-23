import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-doctor-details',
  templateUrl: './doctor-details.component.html',
  styleUrls: ['./doctor-details.component.scss']
})
export class DoctorDetailsComponent implements OnInit {
  doctor: any = null;
  loading = true;
  error = false;
  availabilitySegments: any[] = [];
  profilePhotoUrl: string = '';

  constructor(
    private router: Router,
    private httpService: HttpService
  ) {}

  ngOnInit(): void {
    const storedDoctor = localStorage.getItem('selectedDoctor');
    if (storedDoctor) {
      this.doctor = JSON.parse(storedDoctor);
      this.loading = false;
      this.parseAvailability();
      this.loadProfilePhoto();
    } else {
      this.error = true;
      this.loading = false;
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
    }
  }

  loadProfilePhoto(): void {
    const savedPhoto = localStorage.getItem(`doctor_photo_${this.doctor.id}`);
    if (savedPhoto) {
      this.profilePhotoUrl = savedPhoto;
    }
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePhotoUrl = e.target.result;
        // Save to localStorage
        localStorage.setItem(`doctor_photo_${this.doctor.id}`, e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  parseAvailability(): void {
    this.availabilitySegments = [];
    if (!this.doctor?.availability) return;

    const avail = this.doctor.availability.trim();
    if (!avail) return;

    const parts = avail.split(';').map((p: string) => p.trim()).filter(Boolean);

    for (const part of parts) {
      const match = part.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
      if (match) {
        this.availabilitySegments.push({
          date: match[1],
          dateFormatted: this.formatDate(match[1]),
          startTime: match[2],
          endTime: match[3],
          dayOfWeek: this.getDayOfWeek(match[1])
        });
      }
    }

    this.availabilitySegments.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }

  getDayOfWeek(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}



















