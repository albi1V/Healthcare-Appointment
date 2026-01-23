import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

type Role = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN' | null;

interface Slot {
  label: string;
  start: Date;
  end: Date;
  isoForControl: string;
  disabled: boolean;
  taken?: boolean;
}

@Component({
  selector: 'app-dashbaord',
  templateUrl: './dashbaord.component.html',
  styleUrls: ['./dashbaord.component.scss'],
  providers: [DatePipe]
})
export class DashbaordComponent implements OnInit {
  roleType: Role = null;
  username: string | null = null;
 
  // Available Doctors
  availableDoctors: any[] = [];
  loadingDoctors = false;

  // Booking System
  isBookingAppointment = false;
  selectedDoctor: any = null;
  itemForm: FormGroup;
  selectedDate = '';
  today = '';
  slots: Slot[] = [];
  loadingSlots = false;
  takenSlotKeys = new Set<string>();
  patientId: number | null = null;
  bookingAlert = '';
  showBookingAlert = false;

  constructor(
    private authService: AuthService,
    private httpService: HttpService,
    private router: Router,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    // Initialize booking form
    this.itemForm = this.fb.group({
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      doctorName: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required]
    });

    // Get patient ID from localStorage
    const uid = localStorage.getItem('userId');
    this.patientId = uid ? parseInt(uid, 10) : null;
    if (this.patientId !== null) {
      this.itemForm.controls['patientId'].setValue(this.patientId);
    }

    // Set today's date
    const now = new Date();
    this.selectedDate = this.datePipe.transform(now, 'yyyy-MM-dd') || '';
    this.today = this.selectedDate;
    this.itemForm.controls['date'].setValue(this.selectedDate);
  }

  ngOnInit(): void {
    // Get user role and username from localStorage
    const storedRole = localStorage.getItem('role');
    const storedUsername = localStorage.getItem('username');
    this.roleType = storedRole ? storedRole.toUpperCase() as Role : null;
    this.username = storedUsername;

    // Load doctors only for patient
    if (this.isPatient()) {
      this.loadAvailableDoctors();
      this.checkBookingTrigger();
    }
  }

  /* ========================================
     ROLE METHODS
     ======================================== */
  
  isPatient(): boolean {
    return this.roleType === 'PATIENT';
  }

  isDoctor(): boolean {
    return this.roleType === 'DOCTOR';
  }

  isReceptionist(): boolean {
    return this.roleType === 'RECEPTIONIST';
  }

  isAdmin(): boolean {
    return this.roleType === 'ADMIN';
  }

  getRoleIcon(): string {
    switch (this.roleType) {
      case 'PATIENT':
        return 'fa fa-user-injured';
      case 'DOCTOR':
        return 'fa fa-user-md';
      case 'RECEPTIONIST':
        return 'fa fa-user-tie';
      case 'ADMIN':
        return 'fa fa-users-cog';
      default:
        return 'fa fa-user';
    }
  }

  /* ========================================
     BOOKING TRIGGER
     ======================================== */
  
  checkBookingTrigger(): void {
    const triggerBooking = localStorage.getItem('triggerBooking');
    const selectedDoctor = localStorage.getItem('selectedDoctor');
   
    if (triggerBooking === 'true' && selectedDoctor) {
      localStorage.removeItem('triggerBooking');
      const doctor = JSON.parse(selectedDoctor);
     
      setTimeout(() => {
        this.bookAppointment(doctor);
      }, 500);
    }
  }

  /* ========================================
     DOCTORS MANAGEMENT
     ======================================== */
  
  loadAvailableDoctors(): void {
    this.loadingDoctors = true;
    this.httpService.getDoctors().subscribe({
      next: (response: any) => {
        const doctors = Array.isArray(response) ? response : [];
        this.availableDoctors = doctors.filter(
          (d: any) => d.availability && d.availability.trim() !== ''
        );
        this.loadingDoctors = false;
      },
      error: (err) => {
        console.error('Error loading doctors:', err);
        this.loadingDoctors = false;
      }
    });
  }

  viewDoctor(doctor: any): void {
    localStorage.setItem('selectedDoctor', JSON.stringify(doctor));
    this.router.navigate(['/doctor-details']);
  }

  /* ========================================
     BOOKING MANAGEMENT
     ======================================== */
  
  bookAppointment(doctor: any): void {
    console.log('Booking appointment with doctor:', doctor);
    
    this.selectedDoctor = doctor;
    this.isBookingAppointment = true;

    // Set form values
    this.itemForm.controls['doctorId'].setValue(doctor.id);
    this.itemForm.controls['doctorName'].setValue(doctor.username);
   
    // Reset time selection
    this.itemForm.controls['time'].reset();
    this.takenSlotKeys.clear();

    // Build slots
    this.buildSlotsForSelectedDate();
    this.fetchTakenSlotsForSelectedDate();

    // Scroll to booking section
    setTimeout(() => {
      const bookingSection = document.querySelector('.booking-section-premium');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  cancelBooking(): void {
    this.isBookingAppointment = false;
    this.selectedDoctor = null;
    this.itemForm.reset();
   
    // Restore default values
    if (this.patientId !== null) {
      this.itemForm.controls['patientId'].setValue(this.patientId);
    }
    this.itemForm.controls['date'].setValue(this.today);
    this.selectedDate = this.today;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate = input.value;

    this.itemForm.controls['date'].setValue(this.selectedDate);
    this.itemForm.controls['time'].reset();
    this.takenSlotKeys.clear();

    this.buildSlotsForSelectedDate();
    this.fetchTakenSlotsForSelectedDate();
  }

  selectSlot(slot: Slot): void {
    if (!slot.disabled && !slot.taken) {
      this.itemForm.controls['time'].setValue(slot.isoForControl);
    }
  }

  onSubmit(): void {
    if (this.itemForm.invalid) {
      console.warn('Form is invalid');
      return;
    }

    const isoLocal = this.itemForm.controls['time'].value;
    const formattedTime = this.datePipe.transform(isoLocal, 'yyyy-MM-dd HH:mm:ss');

    const payload = {
      ...this.itemForm.getRawValue(),
      time: formattedTime
    };

    console.log('Submitting appointment:', payload);

    this.httpService.ScheduleAppointment(payload).subscribe({
      next: (response) => {
        console.log('Appointment booked successfully:', response);
        
        this.bookingAlert = '✅ Appointment booked successfully!';
        this.showBookingAlert = true;

        setTimeout(() => {
          this.showBookingAlert = false;
          this.cancelBooking();
        }, 3000);
      },
      error: (error) => {
        console.error('Error booking appointment:', error);
        
        this.bookingAlert = '❌ Slot already booked. Please try another.';
        this.showBookingAlert = true;
        
        setTimeout(() => {
          this.showBookingAlert = false;
        }, 3000);
      }
    });
  }

  /* ========================================
     SLOT GENERATION LOGIC
     ======================================== */
  
  private buildSlotsForSelectedDate(): void {
    this.slots = [];
    
    if (!this.selectedDoctor || !this.selectedDate) {
      console.warn('No doctor or date selected');
      return;
    }

    this.loadingSlots = true;
    
    try {
      const availabilityString = this.selectedDoctor.availability || '';
      console.log('Building slots for date:', this.selectedDate);
      console.log('Availability string:', availabilityString);

      // Parse availability
      const segments = this.parseAvailability(availabilityString);
      console.log('All segments:', segments);

      // Filter for selected date
      const todaysSegments = segments.filter(s => s.date === this.selectedDate);
      console.log('Segments for selected date:', todaysSegments);

      if (todaysSegments.length === 0) {
        console.warn('No availability found for', this.selectedDate);
        this.loadingSlots = false;
        return;
      }

      // Generate slots for each segment
      for (const seg of todaysSegments) {
        const start = this.makeDateFromHM(this.selectedDate, seg.startHM);
        const end = this.makeDateFromHM(this.selectedDate, seg.endHM);
        console.log('Generating slots from', seg.startHM, 'to', seg.endHM);
       
        const generatedSlots = this.generateQuarterHourSlots(start, end);
        this.slots.push(...generatedSlots);
      }

      console.log('Total slots generated:', this.slots.length);

      // Disable past slots for today
      if (this.selectedDate === this.today) {
        const now = new Date();
        this.slots.forEach(s => {
          if (s.end <= now) {
            s.disabled = true;
          }
        });
      }
    } catch (error) {
      console.error('Error building slots:', error);
    } finally {
      this.loadingSlots = false;
    }
  }

  private fetchTakenSlotsForSelectedDate(): void {
    if (!this.selectedDoctor) {
      return;
    }

    console.log('Fetching taken slots for doctor:', this.selectedDoctor.id);

    this.httpService.getAppointmentByDoctor(this.selectedDoctor.id).subscribe({
      next: (appointments: any[]) => {
        this.takenSlotKeys.clear();

        console.log('Appointments for doctor:', appointments);

        for (const appointment of appointments || []) {
          // Normalize 'yyyy-MM-dd HH:mm:ss' to 'yyyy-MM-ddTHH:mm'
          const rawTime = String(appointment.appointmentTime || '').replace(' ', 'T');
          
          if (rawTime.startsWith(this.selectedDate)) {
            const slotKey = rawTime.slice(0, 16); // yyyy-MM-ddTHH:mm
            this.takenSlotKeys.add(slotKey);
            console.log('Taken slot:', slotKey);
          }
        }

        console.log('Total taken slots for this date:', this.takenSlotKeys.size);

        // Mark taken slots
        this.slots = this.slots.map(slot => ({
          ...slot,
          taken: this.takenSlotKeys.has(slot.isoForControl),
          disabled: slot.disabled || this.takenSlotKeys.has(slot.isoForControl)
        }));

        console.log('Slots updated with taken status');
      },
      error: (error) => {
        console.error('Error fetching appointments:', error);
      }
    });
  }

  private parseAvailability(availabilityString: string): Array<{date: string, startHM: string, endHM: string}> {
    if (!availabilityString || availabilityString.trim() === '') {
      console.warn('Empty availability string');
      return [];
    }

    // Split by semicolon for multiple date ranges
    const parts = availabilityString.split(';').map(p => p.trim()).filter(Boolean);
    console.log('Availability parts:', parts);

    const segments: Array<{date: string, startHM: string, endHM: string}> = [];

    for (const part of parts) {
      // Pattern: "2026-01-24 09:00-17:00"
      const match = part.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
     
      if (match) {
        const segment = {
          date: match[1],
          startHM: match[2],
          endHM: match[3]
        };
        segments.push(segment);
        console.log('Parsed segment:', segment);
      } else {
        console.warn('Could not parse part:', part);
      }
    }

    return segments;
  }

  private makeDateFromHM(dateString: string, timeString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  }

  private generateQuarterHourSlots(startDate: Date, endDate: Date): Slot[] {
    const slots: Slot[] = [];
    const stepMs = 15 * 60 * 1000; // 15 minutes in milliseconds

    for (let time = startDate.getTime(); time < endDate.getTime(); time += stepMs) {
      const slotStart = new Date(time);
      const slotEnd = new Date(time + stepMs);

      slots.push({
        label: `${this.formatTimeHHMM(slotStart)} - ${this.formatTimeHHMM(slotEnd)}`,
        start: slotStart,
        end: slotEnd,
        isoForControl: `${this.datePipe.transform(slotStart, 'yyyy-MM-dd')}T${this.datePipe.transform(slotStart, 'HH:mm')}`,
        disabled: false,
        taken: false
      });
    }

    return slots;
  }

  private formatTimeHHMM(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}