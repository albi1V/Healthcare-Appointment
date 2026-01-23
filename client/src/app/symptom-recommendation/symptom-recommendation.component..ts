
import { Component } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

interface Slot {
  label: string;
  start: Date;
  end: Date;
  isoForControl: string;
  disabled: boolean;
  taken?: boolean;
}

@Component({
  selector: 'app-symptom-recommendation',
  templateUrl: './symptom-recommendation.component.html',
  styleUrls: ['./symptom-recommendation.component.scss'],
  providers: [DatePipe]
})
export class SymptomRecommendationComponent {
  symptoms = '';
  recommendedSpecialist = '';
  doctors: any[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  bookingAlert = '';
  showBookingAlert = false;

  isBookingAppointment = false;
  selectedDoctor: any = null;
  itemForm: FormGroup;
  selectedDate = '';
  today = '';
  slots: Slot[] = [];
  loadingSlots = false;
  takenSlotKeys = new Set<string>();
  patientId: number | null = null;

  constructor(
    private httpService: HttpService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
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

  private logBadge(message: string, bg = '#dc2626') {
    console.log(
      `%c${message}`,
      `color:#fff; background:${bg}; padding:3px 8px; border-radius:6px; font-weight:700;`
    );
  }

  private logKV(label: string, value: any) {
    console.log(
      `%c${label}:%c ${value}`,
      'color:#6b7280;font-weight:600;',
      'color:#111827;'
    );
  }

  submitSymptoms(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.doctors = [];
    this.isBookingAppointment = false;

    if (!this.symptoms.trim() || this.symptoms.trim().length < 10) {
      this.errorMessage = 'Please provide detailed symptoms (min 10 characters)';
      return;
    }

    this.loading = true;

    this.httpService.recommendDoctor(this.symptoms).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.recommendedSpecialist = res.recommendedSpecialist;

        this.doctors = (res.availableDoctors || []).map((d: any) => ({
          ...d,
          username: d.username || 'Doctor'
        }));

        this.successMessage =
          this.doctors.length > 0
            ? `Found ${this.doctors.length} ${this.recommendedSpecialist}(s)`
            : `Recommended specialist: ${this.recommendedSpecialist}. No doctors available.`;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to get recommendation';
      }
    });
  }

  bookAppointment(doctor: any): void {
    this.itemForm.controls['doctorId'].setValue(doctor.id);
    this.itemForm.controls['doctorName'].setValue(doctor.username);
    this.selectedDoctor = doctor;
    this.isBookingAppointment = true;

    this.itemForm.controls['time'].reset();
    this.takenSlotKeys.clear();

    this.buildSlotsForSelectedDate();
    this.fetchTakenSlotsForSelectedDate();
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
    if (!slot.disabled) {
      this.itemForm.controls['time'].setValue(slot.isoForControl);
    }
  }

  onSubmit(): void {
    if (this.itemForm.invalid) return;

    const isoLocal: string = this.itemForm.controls['time'].value;
    const formattedTime = this.datePipe.transform(isoLocal, 'yyyy-MM-dd HH:mm:ss');

    const payload = {
      ...this.itemForm.getRawValue(),
      time: formattedTime
    };

    this.httpService.ScheduleAppointment(payload).subscribe({
      next: () => {
        this.logBadge('✅ Slot booked successfully', '#000000');
        this.logKV('Doctor ID', payload.doctorId);
        this.logKV('Patient ID', payload.patientId);
        this.logKV('Time', formattedTime);

        this.bookingAlert = '✅ Appointment booked successfully!';
        this.showBookingAlert = true;

        setTimeout(() => {
          this.showBookingAlert = false;
        }, 4000);

        this.isBookingAppointment = false;
        this.itemForm.reset();
        this.selectedDoctor = null;

        if (this.patientId !== null) {
          this.itemForm.controls['patientId'].setValue(this.patientId);
        }
        this.itemForm.controls['date'].setValue(this.today);
        this.selectedDate = this.today;
      },
      error: () => {
        this.logBadge('❌ Slot already booked. Please try another.', '#ef4444');

        this.bookingAlert = '❌ Slot already booked. Please try another.';
        this.showBookingAlert = true;
        setTimeout(() => {
          this.showBookingAlert = false;
        }, 4000);
      }
    });
  }

  private buildSlotsForSelectedDate(): void {
    this.slots = [];
    if (!this.selectedDoctor || !this.selectedDate) return;

    this.loadingSlots = true;
    try {
      const segments = this.parseAvailability(this.selectedDoctor.availability || '');
      const todays = segments.filter(s => s.date === this.selectedDate);

      for (const seg of todays) {
        const start = this.makeDateFromHM(this.selectedDate, seg.startHM);
        const end = this.makeDateFromHM(this.selectedDate, seg.endHM);
        this.slots.push(...this.generateQuarterHourSlots(start, end));
      }

      if (this.selectedDate === this.today) {
        const now = new Date();
        this.slots.forEach(s => {
          if (s.end <= now) s.disabled = true;
        });
      }
    } finally {
      this.loadingSlots = false;
    }
  }

  private fetchTakenSlotsForSelectedDate(): void {
    if (!this.selectedDoctor) return;

    this.httpService.getAppointmentByDoctor(this.selectedDoctor.id).subscribe({
      next: (appts: any[]) => {
        this.takenSlotKeys.clear();

        for (const a of appts || []) {
          const raw = String(a.appointmentTime || '').replace(' ', 'T');
          if (raw.startsWith(this.selectedDate)) {
            this.takenSlotKeys.add(raw.slice(0, 16));
          }
        }

        this.slots = this.slots.map(s => ({
          ...s,
          taken: this.takenSlotKeys.has(s.isoForControl),
          disabled: s.disabled || this.takenSlotKeys.has(s.isoForControl)
        }));
      }
    });
  }

  private parseAvailability(avail: string) {
    return avail
      .split(';')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => {
        const m = p.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
        return m ? { date: m[1], startHM: m[2], endHM: m[3] } : null;
      })
      .filter(Boolean) as any[];
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

  clearForm(): void {
    this.symptoms = '';
    this.recommendedSpecialist = '';
    this.doctors = [];
    this.errorMessage = '';
    this.successMessage = '';
    this.isBookingAppointment = false;
    this.selectedDoctor = null;
  }

  cancelBooking(): void {
    this.isBookingAppointment = false;
    this.selectedDoctor = null;
    this.itemForm.controls['time'].reset();
  }
}
``
