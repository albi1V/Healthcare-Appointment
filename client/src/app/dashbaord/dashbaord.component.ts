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
 
  // ⭐ Available Doctors
  availableDoctors: any[] = [];
  loadingDoctors = false;

  // ⭐ Booking System
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

    const uid = localStorage.getItem('userId');
    this.patientId = uid ? parseInt(uid, 10) : null;
    if (this.patientId !== null) {
      this.itemForm.controls['patientId'].setValue(this.patientId);
    }

    const now = new Date();
    this.selectedDate = this.datePipe.transform(now, 'yyyy-MM-dd') || '';
    this.today = this.selectedDate;
    this.itemForm.controls['date'].setValue(this.selectedDate);
  }

  ngOnInit(): void {
    const storedRole = localStorage.getItem('role');
    const storedUsername = localStorage.getItem('username');
    this.roleType = storedRole ? storedRole.toUpperCase() as Role : null;
    this.username = storedUsername;

    // ⭐ Load doctors only for patient
    if (this.isPatient()) {
      this.loadAvailableDoctors();
     
      // ⭐ Check if we need to trigger booking (from doctor-details page)
      this.checkBookingTrigger();
    }
  }

  // ======================
  // Check Booking Trigger
  // ======================
  checkBookingTrigger(): void {
    const triggerBooking = localStorage.getItem('triggerBooking');
    const selectedDoctor = localStorage.getItem('selectedDoctor');
   
    if (triggerBooking === 'true' && selectedDoctor) {
      localStorage.removeItem('triggerBooking');
      const doctor = JSON.parse(selectedDoctor);
     
      // Wait for doctors to load
      setTimeout(() => {
        this.bookAppointment(doctor);
      }, 500);
    }
  }

  // ======================
  // Role Helpers
  // ======================
  isPatient(): boolean { return this.roleType === 'PATIENT'; }
  isDoctor(): boolean { return this.roleType === 'DOCTOR'; }
  isReceptionist(): boolean { return this.roleType === 'RECEPTIONIST'; }
  isAdmin(): boolean { return this.roleType === 'ADMIN'; }

  // ======================
  // Load Doctors
  // ======================
  loadAvailableDoctors(): void {
    this.loadingDoctors = true;
    this.httpService.getDoctors().subscribe({
      next: (response: any) => {
        const doctors = Array.isArray(response) ? response : [];
        this.availableDoctors = doctors.filter(
          d => d.availability && d.availability.trim() !== ''
        );
        this.loadingDoctors = false;
      },
      error: () => {
        this.loadingDoctors = false;
      }
    });
  }

  // ======================
  // View Doctor Details
  // ======================
  viewDoctor(doctor: any): void {
    localStorage.setItem('selectedDoctor', JSON.stringify(doctor));
    this.router.navigate(['/doctor-details']);
  }

  // ======================
  // Book Appointment - Show Booking Form
  // ======================
  bookAppointment(doctor: any): void {
    console.log('📋 Booking for doctor:', doctor);
    console.log('📋 Doctor availability string:', doctor.availability);
   
    // Set selected doctor and show booking form
    this.selectedDoctor = doctor;
    this.isBookingAppointment = true;

    // Populate form with doctor details
    this.itemForm.controls['doctorId'].setValue(doctor.id);
    this.itemForm.controls['doctorName'].setValue(doctor.username);
   
    // Reset time selection
    this.itemForm.controls['time'].reset();
    this.takenSlotKeys.clear();

    // Build slots for selected date
    this.buildSlotsForSelectedDate();
    this.fetchTakenSlotsForSelectedDate();

    // Scroll to booking section
    setTimeout(() => {
      document.querySelector('.booking-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  // ======================
  // Cancel Booking
  // ======================
  cancelBooking(): void {
    this.isBookingAppointment = false;
    this.selectedDoctor = null;
    this.itemForm.reset();
   
    if (this.patientId !== null) {
      this.itemForm.controls['patientId'].setValue(this.patientId);
    }
    this.itemForm.controls['date'].setValue(this.today);
    this.selectedDate = this.today;
  }

  // ======================
  // Date Change Handler
  // ======================
  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate = input.value;

    this.itemForm.controls['date'].setValue(this.selectedDate);
    this.itemForm.controls['time'].reset();
    this.takenSlotKeys.clear();

    this.buildSlotsForSelectedDate();
    this.fetchTakenSlotsForSelectedDate();
  }

  // ======================
  // Select Time Slot
  // ======================
  selectSlot(slot: Slot): void {
    if (!slot.disabled) {
      this.itemForm.controls['time'].setValue(slot.isoForControl);
    }
  }

  // ======================
  // Submit Booking
  // ======================
  onSubmit(): void {
    if (this.itemForm.invalid) return;

    const isoLocal = this.itemForm.controls['time'].value;
    const formattedTime = this.datePipe.transform(isoLocal, 'yyyy-MM-dd HH:mm:ss');

    const payload = {
      ...this.itemForm.getRawValue(),
      time: formattedTime
    };

    this.httpService.ScheduleAppointment(payload).subscribe({
      next: () => {
        this.bookingAlert = '✅ Slot booked successfully!';
        this.showBookingAlert = true;

        setTimeout(() => {
          this.showBookingAlert = false;
          this.cancelBooking();
        }, 2000);
      },
      error: () => {
        this.bookingAlert = '❌ Slot already booked. Please try another.';
        this.showBookingAlert = true;
        setTimeout(() => {
          this.showBookingAlert = false;
        }, 3000);
      }
    });
  }

  // ======================
  // SLOT LOGIC (Private Methods)
  // ======================
  private buildSlotsForSelectedDate(): void {
    this.slots = [];
    if (!this.selectedDoctor || !this.selectedDate) {
      console.log('❌ No doctor or date selected');
      return;
    }

    this.loadingSlots = true;
    try {
      const availabilityString = this.selectedDoctor.availability || '';
      console.log('📅 Processing availability for date:', this.selectedDate);
      console.log('📅 Availability string:', availabilityString);

      // Parse availability
      const segments = this.parseAvailability(availabilityString);
      console.log('📅 All parsed segments:', segments);

      // Filter for selected date only
      const todaysSegments = segments.filter(s => s.date === this.selectedDate);
      console.log('📅 Segments for selected date:', todaysSegments);

      if (todaysSegments.length === 0) {
        console.log('⚠️ No availability found for', this.selectedDate);
        this.loadingSlots = false;
        return;
      }

      // Generate slots for each segment
      for (const seg of todaysSegments) {
        const start = this.makeDateFromHM(this.selectedDate, seg.startHM);
        const end = this.makeDateFromHM(this.selectedDate, seg.endHM);
        console.log(`⏰ Generating slots from ${seg.startHM} to ${seg.endHM}`);
       
        const generatedSlots = this.generateQuarterHourSlots(start, end);
        this.slots.push(...generatedSlots);
      }

      console.log('✅ Total slots generated:', this.slots.length);

      // Disable past slots for today
      if (this.selectedDate === this.today) {
        const now = new Date();
        this.slots.forEach(s => {
          if (s.end <= now) s.disabled = true;
        });
      }
    } catch (error) {
      console.error('❌ Error building slots:', error);
    } finally {
      this.loadingSlots = false;
    }
  }

  private fetchTakenSlotsForSelectedDate(): void {
    if (!this.selectedDoctor) return;

    console.log('🔍 Fetching taken slots for doctor:', this.selectedDoctor.id);

    this.httpService.getAppointmentByDoctor(this.selectedDoctor.id).subscribe({
      next: (appts: any[]) => {
        this.takenSlotKeys.clear();

        console.log('📋 Appointments for doctor:', appts);

        for (const a of appts || []) {
          // Normalize 'yyyy-MM-dd HH:mm:ss' → 'yyyy-MM-ddTHH:mm'
          const raw = String(a.appointmentTime || '').replace(' ', 'T');
          if (raw.startsWith(this.selectedDate)) {
            const slotKey = raw.slice(0, 16);
            this.takenSlotKeys.add(slotKey);
            console.log('🔒 Taken slot:', slotKey);
          }
        }

        console.log('🔒 Total taken slots for this date:', this.takenSlotKeys.size);

        // Mark taken slots
        this.slots = this.slots.map(s => ({
          ...s,
          taken: this.takenSlotKeys.has(s.isoForControl),
          disabled: s.disabled || this.takenSlotKeys.has(s.isoForControl)
        }));

        console.log('✅ Slots updated with taken status');
      },
      error: (err) => {
        console.error('❌ Error fetching appointments:', err);
      }
    });
  }

  private parseAvailability(avail: string) {
    if (!avail || avail.trim() === '') {
      console.log('⚠️ Empty availability string');
      return [];
    }

    // Split by semicolon for multiple date ranges
    const parts = avail.split(';').map(p => p.trim()).filter(Boolean);
    console.log('📅 Availability parts:', parts);

    const segments: any[] = [];

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
        console.log('✅ Parsed segment:', segment);
      } else {
        console.log('⚠️ Could not parse part:', part);
      }
    }

    return segments;
  }

  private makeDateFromHM(d: string, hm: string): Date {
    const [y, m, da] = d.split('-').map(Number);
    const [H, M] = hm.split(':').map(Number);
    return new Date(y, m - 1, da, H, M);
  }

  private generateQuarterHourSlots(start: Date, end: Date): Slot[] {
    const out: Slot[] = [];
    const step = 15 * 60 * 1000;

    for (let t = start.getTime(); t < end.getTime(); t += step) {
      const st = new Date(t);
      const en = new Date(t + step);

      out.push({
        label: `${this.hhmm(st)} - ${this.hhmm(en)}`,
        start: st,
        end: en,
        isoForControl: `${this.datePipe.transform(st, 'yyyy-MM-dd')}T${this.datePipe.transform(st, 'HH:mm')}`,
        disabled: false
      });
    }

    return out;
  }

  private hhmm(d: Date): string {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}
