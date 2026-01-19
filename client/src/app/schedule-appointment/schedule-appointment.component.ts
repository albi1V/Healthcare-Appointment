
import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

interface Slot {
  label: string;        // "12:00 - 12:15"
  start: Date;
  end: Date;
  isoForControl: string;// "yyyy-MM-ddTHH:mm"
  disabled: boolean;    
  taken?: boolean;
}

type Day =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY'
  | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

@Component({
  selector: 'app-schedule-appointment',
  templateUrl: './schedule-appointment.component.html',
  styleUrls: ['./schedule-appointment.component.scss'],
  providers: [DatePipe]
})
export class ScheduleAppointmentComponent implements OnInit {

  doctorList: any[] = [];
  itemForm: FormGroup;

  responseMessage = '';
  isAdded = false;

  patientId: number | null = null;

  // Selected context
  selectedDoctor: { id: number; name?: string; specialty?: string; availability?: string } | null = null;
  selectedDate: string = ''; // "yyyy-MM-dd"
  today: string = '';

  // Slot grid
  slots: Slot[] = [];
  loadingSlots = false;
  takenSlotKeys = new Set<string>(); // yyyy-MM-ddTHH:mm keys

  constructor(
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.itemForm = this.formBuilder.group({
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      doctorName: ['', Validators.required],   // ✅ NEW
      date: ['', Validators.required],         // ✅ NEW
      time: ['', Validators.required]          // selected 15-min slot
    });
  }

  ngOnInit(): void {
    const userIdString = localStorage.getItem('userId');
    this.patientId = userIdString ? parseInt(userIdString, 10) : null;

    if (this.patientId !== null) {
      this.itemForm.controls['patientId'].setValue(this.patientId);
    }

    const now = new Date();
    this.selectedDate = this.datePipe.transform(now, 'yyyy-MM-dd') || '';
    this.today = this.selectedDate;
    this.itemForm.controls['date'].setValue(this.selectedDate);   // ✅ keep form date in sync

    this.getDoctors();
  }

getDoctors(): void {
  this.httpService.getDoctors().subscribe(
    (data: any) => {
      this.doctorList = ((data as any[]) ?? []).map(d => ({
        ...d,
        name: d.username   // map backend field → UI field
      }));
    },
    (err: any) => {
      console.error('Error fetching doctors', err);
    }
  );
}


  /** Click “Appointment” on a row */
  addAppointment(doc: any): void {
    this.itemForm.controls['doctorId'].setValue(doc.id);
    this.itemForm.controls['doctorName'].setValue(doc.name || 'Doctor');  // ✅ set name in form
    this.selectedDoctor = {
      id: doc.id,
      name: doc.name,
      specialty: doc.specialty,
      availability: doc.availability
    };
    this.isAdded = true;
    this.responseMessage = '';

    // Reset previous selection
    this.itemForm.controls['time'].reset();
    this.takenSlotKeys.clear();

    // Build slots for current date and mark taken ones
    this.buildSlotsForSelectedDate();
    this.fetchTakenSlotsForSelectedDate();
  }

  /** Date changed */
  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate = input.value;
    this.itemForm.controls['date'].setValue(this.selectedDate); // ✅ keep in form

    // Reset slot selection and rebuild
    this.itemForm.controls['time'].reset();
    this.takenSlotKeys.clear();
    this.buildSlotsForSelectedDate();
    this.fetchTakenSlotsForSelectedDate();
  }

  /** Pick a slot */
  selectSlot(slot: Slot): void {
    if (slot.disabled) return;
    this.itemForm.controls['time'].setValue(slot.isoForControl);
  }

  /** Submit with a fresh pre-flight check to prevent double booking */
  onSubmit(): void {
    if (this.itemForm.invalid) return;

    const selectedIso = this.itemForm.controls['time'].value as string;
    if (!selectedIso) return;

    // Fresh check: re-fetch taken slots for the selected date and doctor, then decide
    this.httpService.getAppointmentByDoctor(this.itemForm.controls['doctorId'].value).subscribe({
      next: (appts: any) => {
        const isTakenNow = this.isIsoTakenOnSelectedDate(selectedIso, appts);
        if (isTakenNow) {
          this.responseMessage = 'This slot has just been taken. Please choose another.';
          return;
        }

        // Safe to submit
        const formattedTime = this.datePipe.transform(selectedIso, 'yyyy-MM-dd HH:mm:ss');
        const formRaw = this.itemForm.getRawValue();
        const formValue = { ...formRaw, time: formattedTime };

        this.httpService.ScheduleAppointment(formValue).subscribe(
          () => {
            this.responseMessage = 'Appointment saved successfully';
            this.isAdded = false;
            this.itemForm.reset();
            this.selectedDoctor = null;

            // Restore patientId and today’s date after reset
            if (this.patientId !== null) {
              this.itemForm.controls['patientId'].setValue(this.patientId);
            }
            this.itemForm.controls['date'].setValue(this.today);
            this.selectedDate = this.today;
          },
          (err: unknown) => {
            // If backend enforces uniqueness and returns 409/400, inform user
            this.responseMessage = 'Failed to save appointment';
            console.error(err);
          }
        );
      },
      error: () => {
        // If we cannot check, proceed but server should still enforce uniqueness
        const formattedTime = this.datePipe.transform(selectedIso, 'yyyy-MM-dd HH:mm:ss');
        const formRaw = this.itemForm.getRawValue();
        const formValue = { ...formRaw, time: formattedTime };

        this.httpService.ScheduleAppointment(formValue).subscribe(
          () => {
            this.responseMessage = 'Appointment saved successfully';
            this.isAdded = false;
            this.itemForm.reset();
            this.selectedDoctor = null;

            if (this.patientId !== null) {
              this.itemForm.controls['patientId'].setValue(this.patientId);
            }
            this.itemForm.controls['date'].setValue(this.today);
            this.selectedDate = this.today;
          },
          (err: unknown) => {
            this.responseMessage = 'Failed to save appointment ,it already allowed';
            console.error(err);
          }
        );
      }
    });
  }


/** Check if selected ISO slot is taken on selected date from doctor’s appointments list */
private isIsoTakenOnSelectedDate(selectedIso: string, appts: any[]): boolean {
  // selectedIso looks like "yyyy-MM-ddTHH:mm"
  for (const a of appts ?? []) {
    const raw = String(a.appointmentTime || '').trim();
    if (!raw) continue;

    const isoLike = raw.includes('T') ? raw : raw.replace(' ', 'T');
    if (isoLike.slice(0, 16) === selectedIso) return true;
  }
  return false;
}


  /* -------------------------------
     Slot generation & helpers
  --------------------------------*/

  private buildSlotsForSelectedDate(): void {
    this.slots = [];
    if (!this.selectedDoctor || !this.selectedDate) return;

    this.loadingSlots = true;
    try {
      const dayOfWeek = this.getDayOfWeek(this.selectedDate);
const segments = this.parseAvailability(this.selectedDoctor.availability || '');
const todays = segments.filter(s => s.date === this.selectedDate);

      const newSlots: Slot[] = [];

      for (const seg of todays) {
        const start = this.makeDateFromHM(this.selectedDate, seg.startHM);
        const end = this.makeDateFromHM(this.selectedDate, seg.endHM);
        newSlots.push(...this.generateQuarterHourSlots(start, end));
      }

      // Disable past slots for today
      const now = new Date();
      if (this.selectedDate === this.today) {
        for (const s of newSlots) if (s.end <= now) s.disabled = true;
      }

      this.slots = newSlots;
    } finally {
      this.loadingSlots = false;
    }
  }


/* Mark already-taken slots (UI) */
private fetchTakenSlotsForSelectedDate(): void {
  if (!this.selectedDoctor) return;

  this.httpService.getAppointmentByDoctor(this.selectedDoctor.id).subscribe({
    next: (appts: any) => {
      this.takenSlotKeys.clear();

      for (const a of appts ?? []) {
        const raw = String(a.appointmentTime || '').trim();
        if (!raw) continue;

        // Normalize to "yyyy-MM-ddTHH:mm[:ss]" and keep first 16 chars
        const isoLike = raw.includes('T') ? raw : raw.replace(' ', 'T');
        // Must match the selected date
        if (!isoLike.startsWith(this.selectedDate)) continue;

        const key16 = isoLike.slice(0, 16); // yyyy-MM-ddTHH:mm
        this.takenSlotKeys.add(key16);
      }

      // 🔒 Disable slots that are already taken
      this.slots = this.slots.map(s => {
        const isTaken = this.takenSlotKeys.has(s.isoForControl);
        return {
          ...s,
          taken: isTaken,
          disabled: s.disabled || isTaken
        };
      });
    },
    error: () => {
      // Silent: if we can't fetch, UI remains as-is; server still enforces uniqueness
    }
  });
}





  
  private getDayOfWeek(yyyyMMdd: string): Day {
    const [y, m, d] = yyyyMMdd.split('-').map(n => parseInt(n, 10));
    const dt = new Date(y, m - 1, d);
    const idx = dt.getDay(); // 0=Sun..6=Sat
    const map: Day[] = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    return map[idx];
  }

  private makeDateFromHM(yyyyMMdd: string, hm: string): Date {
    const [y, m, d] = yyyyMMdd.split('-').map(n => parseInt(n, 10));
    const [H, M] = hm.split(':').map(n => parseInt(n, 10));
    return new Date(y, m - 1, d, H, M, 0, 0);
  }



private parseAvailability(availText: string): {
  date: string;
  startHM: string;
  endHM: string;
}[] {
  const parts = availText.split(';').map(p => p.trim()).filter(Boolean);
  const results: { date: string; startHM: string; endHM: string }[] = [];
  for (const p of parts) {
    const m = p.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (!m) continue;
    results.push({
      date: m[1],
      startHM: m[2],
      endHM: m[3]
    });
  }
  return results;
}



  private normalizeDay(d: string): Day | null {
    const map: Record<string, Day> = {
      MONDAY: 'MONDAY', MON: 'MONDAY',
      TUESDAY: 'TUESDAY', TUE: 'TUESDAY', TUES: 'TUESDAY',
      WEDNESDAY: 'WEDNESDAY', WED: 'WEDNESDAY',
      THURSDAY: 'THURSDAY', THU: 'THURSDAY', THURS: 'THURSDAY',
      FRIDAY: 'FRIDAY', FRI: 'FRIDAY',
      SATURDAY: 'SATURDAY', SAT: 'SATURDAY',
      SUNDAY: 'SUNDAY', SUN: 'SUNDAY'
    };
    return map[d] || null;
  }

  /** Convert "10:00 AM" or "13:15" → "HH:mm" */
  private to24h(s: string): string | null {
    const t = s.toUpperCase().replace(/\s+/g, '').replace('.', '');
    const ampm = t.match(/^(\d{1,2})(?::(\d{2}))?(AM|PM)$/);
    if (ampm) {
      let hh = parseInt(ampm[1], 10);
      const mm = ampm[2] ? parseInt(ampm[2], 10) : 0;
      const mer = ampm[3];
      if (mer === 'AM') {
        if (hh === 12) hh = 0;
      } else {
        if (hh < 12) hh += 12;
      }
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }
    const hhmm = t.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmm) {
      const hh = parseInt(hhmm[1], 10);
      const mm = parseInt(hhmm[2], 10);
      if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) {
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      }
    }
    return null;
  }

  /** Generate 15-min slots */
  private generateQuarterHourSlots(start: Date, end: Date): Slot[] {
    const slots: Slot[] = [];
    const ms15 = 15 * 60 * 1000;
    for (let t = start.getTime(); t < end.getTime(); t += ms15) {
      const st = new Date(t);
      const en = new Date(Math.min(t + ms15, end.getTime()));
      if (en <= st) continue;

      const label = `${this.hhmm(st)} - ${this.hhmm(en)}`;
      const isoForControl = `${this.datePipe.transform(st, 'yyyy-MM-dd')!}T${this.datePipe.transform(st, 'HH:mm')!}`;
      slots.push({ label, start: st, end: en, isoForControl, disabled: false });
    }
    return slots;
  }

  private hhmm(dt: Date): string {
    const h = String(dt.getHours()).padStart(2, '0');
    const m = String(dt.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
}
