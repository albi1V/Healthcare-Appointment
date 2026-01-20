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

  // Availability display

  availabilitySegments: any[] = [];
 
  constructor(

    private router: Router,

    private httpService: HttpService

  ) {}
 
  ngOnInit(): void {

    // Get doctor from localStorage (set when clicking "View Profile")

    const storedDoctor = localStorage.getItem('selectedDoctor');

    if (storedDoctor) {

      this.doctor = JSON.parse(storedDoctor);

      this.loading = false;

      this.parseAvailability();

    } else {

      // If no doctor in storage, redirect back

      this.error = true;

      this.loading = false;

      setTimeout(() => {

        this.router.navigate(['/dashboard']);

      }, 2000);

    }

  }
 
  parseAvailability(): void {

    this.availabilitySegments = [];

    if (!this.doctor?.availability) return;
 
    const avail = this.doctor.availability.trim();

    if (!avail) return;
 
    // Split by semicolon for multiple date ranges

    const parts = avail.split(';').map((p: string) => p.trim()).filter(Boolean);
 
    for (const part of parts) {

      // Pattern: "2026-01-24 09:00-17:00"

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
 
    // Sort by date

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
 