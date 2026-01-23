import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

declare const Swal: any; // Use SweetAlert2 from CDN

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
  isSubmitting = false; // submit UX

  patientId: number | null = null;

  // Selected context
  selectedDoctor: { id: number; name?: string; specialty?: string; availability?: string } | null = null;
  selectedDate: string = ''; // "yyyy-MM-dd"
  today: string = '';

  // Slot grid
  slots: Slot[] = [];
  loadingSlots = false;
  takenSlotKeys = new Set<string>(); // yyyy-MM-ddTHH:mm keys

  // Toast helper
  private toast = () =>
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      didOpen: (t: any) => {
        t.addEventListener('mouseenter', Swal.stopTimer);
        t.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

  constructor(
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.itemForm = this.formBuilder.group({
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      doctorName: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required] // selected 15-min slot
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
    this.itemForm.controls['date'].setValue(this.selectedDate);

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
        this.showErrorAlert('Failed to load doctors. Please try again.');
      }
    );
  }

  /** Click “Appointment” on a row */
  addAppointment(doc: any): void {
    this.itemForm.controls['doctorId'].setValue(doc.id);
    this.itemForm.controls['doctorName'].setValue(doc.name || 'Doctor');
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
    this.itemForm.controls['date'].setValue(this.selectedDate);

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

    this.isSubmitting = true; // start spinner

    // Fresh check before submit
    this.httpService.getAppointmentByDoctor(this.itemForm.controls['doctorId'].value).subscribe({
      next: (appts: any) => {
        const isTakenNow = this.isIsoTakenOnSelectedDate(selectedIso, appts);
        if (isTakenNow) {
          this.isSubmitting = false;
          this.responseMessage = 'This slot has just been taken. Please choose another.';
          this.toast().fire({ icon: 'warning', title: 'Slot already taken' });
          return;
        }

        // Safe to submit
        const formattedTime = this.datePipe.transform(selectedIso, 'yyyy-MM-dd HH:mm:ss');
        const formRaw = this.itemForm.getRawValue();
        const formValue = { ...formRaw, time: formattedTime };

        this.createAppointmentWithFallback(formValue, selectedIso);
      },
      error: () => {
        // If we cannot check, proceed but server should still enforce uniqueness
        const formattedTime = this.datePipe.transform(selectedIso, 'yyyy-MM-dd HH:mm:ss');
        const formRaw = this.itemForm.getRawValue();
        const formValue = { ...formRaw, time: formattedTime };

        this.createAppointmentWithFallback(formValue, selectedIso);
      }
    });
  }

  /** Try new /appointments first; if 404 or method missing, fallback to existing endpoint */
  private createAppointmentWithFallback(formValue: any, selectedIso: string) {
    const newCall = (this.httpService as any).createAppointmentV2;

    const onSuccess = (res: any) => {
      const apptId = res?.id ?? res?.appointmentId ?? '';
      const docName = this.itemForm.controls['doctorName'].value || 'Doctor';
      const niceTime = this.datePipe.transform(selectedIso, 'MMM d, y, h:mm a');

      this.responseMessage = apptId
        ? `Appointment #${apptId} booked successfully. A confirmation email has been sent to your registered email.`
        : `Appointment booked successfully. A confirmation email has been sent to your registered email.`;

      // SweetAlert2 success
      this.showSuccessAlert(docName, niceTime, apptId);

      // Reset UI
      this.isAdded = false;
      this.itemForm.reset();
      this.selectedDoctor = null;

      if (this.patientId !== null) {
        this.itemForm.controls['patientId'].setValue(this.patientId);
      }
      this.itemForm.controls['date'].setValue(this.today);
      this.selectedDate = this.today;

      this.isSubmitting = false;
    };

    const onError = (err: any) => {
      if (err?.status === 409 && err?.error) {
        this.responseMessage = String(err.error); // e.g., "Slot already booked"
        this.showErrorAlert(this.responseMessage);
      } else {
        this.responseMessage = 'Failed to save appointment';
        this.showErrorAlert('Booking failed. Please try another slot or try again later.');
      }
      console.error(err);
      this.isSubmitting = false;
    };

    if (typeof newCall === 'function') {
      newCall
        .call(this.httpService, {
          patientId: this.itemForm.controls['patientId'].value,
          doctorId: this.itemForm.controls['doctorId'].value,
          time: formValue.time
        })
        .subscribe(onSuccess, (err: any) => {
          if (err?.status === 404) {
            this.httpService.ScheduleAppointment(formValue).subscribe(onSuccess, onError);
          } else {
            onError(err);
          }
        });
    } else {
      this.httpService.ScheduleAppointment(formValue).subscribe(onSuccess, onError);
    }
  }

  /** Check if selected ISO slot is taken on selected date from doctor’s appointments list */
  private isIsoTakenOnSelectedDate(selectedIso: string, appts: any[]): boolean {
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

  private fetchTakenSlotsForSelectedDate(): void {
    if (!this.selectedDoctor) return;

    this.httpService.getAppointmentByDoctor(this.selectedDoctor.id).subscribe({
      next: (appts: any) => {
        this.takenSlotKeys.clear();

        for (const a of appts ?? []) {
          const raw = String(a.appointmentTime || '').trim();
          if (!raw) continue;

        const isoLike = raw.includes('T') ? raw : raw.replace(' ', 'T');
          if (!isoLike.startsWith(this.selectedDate)) continue;

          const key16 = isoLike.slice(0, 16); // yyyy-MM-ddTHH:mm
          this.takenSlotKeys.add(key16);
        }

        // Disable slots that are already taken
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
      results.push({ date: m[1], startHM: m[2], endHM: m[3] });
    }
    return results;
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

  /* SweetAlert2 helpers */
  private showSuccessAlert(doctorName: string, niceTime: string | null, apptId: string | number | '') {
    Swal.fire({
      icon: 'success',
      title: 'Booking Confirmed',
      html: `
        <div style="text-align:left;margin:0 auto;max-width:420px">
          <div><strong>Doctor:</strong> ${this.escapeHtml(doctorName)}</div>
          <div><strong>Time:</strong> ${this.escapeHtml(niceTime || '')}</div>
          ${apptId ? `<div><strong>Reference:</strong> ${this.escapeHtml(String(apptId))}</div>` : ''}
          <div style="margin-top:8px;color:#6b7280">A confirmation email has been sent to your registered email.</div>
        </div>
      `,
      confirmButtonText: 'Great',
      confirmButtonColor: '#0d6efd',
      customClass: { popup: 'swal2-rounded' }
    });
  }

  private showErrorAlert(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'Booking Failed',
      text: message || 'Something went wrong. Please try again.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#0d6efd',
      customClass: { popup: 'swal2-rounded' }
    });
  }

  private escapeHtml(s: string) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

