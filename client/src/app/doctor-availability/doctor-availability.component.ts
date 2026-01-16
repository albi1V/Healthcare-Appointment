import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-doctor-availability',
  templateUrl: './doctor-availability.component.html',
  styleUrls: ['./doctor-availability.component.scss'],
})
export class DoctorAvailabilityComponent implements OnInit {

  form!: FormGroup;

  responseMessage = '';
  isAdded = false;

  doctorId: number | null = null;

  // 🔒 Used by <input type="date" min="...">
  today: string = '';

  constructor(private fb: FormBuilder, private httpService: HttpService) {}

  /* =========================
     Lifecycle
  ==========================*/
  ngOnInit(): void {

    // ✅ SET TODAY (LOCAL TIME, NOT UTC)
    this.today = this.getTodayLocal();

    const userIdString = localStorage.getItem('userId');
    this.doctorId = userIdString ? parseInt(userIdString, 10) : null;

    this.form = this.fb.group({
      doctorId: [{ value: this.doctorId, disabled: true }, Validators.required],
      slots: this.fb.array([], [this.noOverlapValidator]),
    });

    // Start with one empty slot
    this.addSlot();
  }

  /* =========================
     Getters
  ==========================*/
  get doctorIdCtrl(): FormControl {
    return this.form.get('doctorId') as FormControl;
  }

  get slots(): FormArray {
    return this.form.get('slots') as FormArray;
  }

  /* =========================
     Slot Management
  ==========================*/
  addSlot(): void {
    const slotGroup = this.fb.group(
      {
        date: ['', [Validators.required, this.notPastDateValidator]], // yyyy-MM-dd
        startTime: ['', Validators.required],                         // HH:mm
        endTime: ['', Validators.required],                           // HH:mm
      },
      { validators: [this.timeRangeValidator] }
    );
    this.slots.push(slotGroup);
  }

  removeSlot(index: number): void {
    this.slots.removeAt(index);
    this.slots.updateValueAndValidity();
  }

  /* =========================
     Validators
  ==========================*/

  // Start time must be before end time
  private timeRangeValidator = (ctrl: AbstractControl) => {
    const start = ctrl.get('startTime')?.value;
    const end = ctrl.get('endTime')?.value;
    if (!start || !end) return null;
    return start < end ? null : { timeRange: true };
  };

  // Prevent overlapping slots on the same date
  private noOverlapValidator = (arrayCtrl: AbstractControl) => {
    const groups = (arrayCtrl as FormArray).controls as FormGroup[];

    const slots = groups
      .map(g => ({
        date: g.get('date')?.value,
        start: g.get('startTime')?.value,
        end: g.get('endTime')?.value,
      }))
      .filter(s => s.date && s.start && s.end);

    slots.sort((a, b) =>
      `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`)
    );

    for (let i = 1; i < slots.length; i++) {
      const prev = slots[i - 1];
      const curr = slots[i];
      if (curr.date === prev.date && curr.start < prev.end) {
        return { overlap: true };
      }
    }

    return null;
  };

  // 🔒 BLOCK PAST DATES (FORM-LEVEL SAFETY)
  private notPastDateValidator = (ctrl: AbstractControl) => {
    if (!ctrl.value) return null;

    const [y, m, d] = ctrl.value.split('-').map(Number);
    const selected = new Date(y, m - 1, d);
    selected.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selected < today ? { pastDate: true } : null;
  };

  /* =========================
     Helpers
  ==========================*/

  // ✅ Local date formatter (timezone safe)
  private getTodayLocal(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Build backend availability string
  // Example: 2026-01-20 02:00-09:00; 2026-01-22 10:00-12:00
  private buildAvailabilityText(): string {
    const items = this.slots.value as {
      date: string;
      startTime: string;
      endTime: string;
    }[];

    const validItems = items.filter(
      s => s.date && s.startTime && s.endTime && s.startTime < s.endTime
    );

    validItems.sort((a, b) =>
      `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
    );

    return validItems
      .map(s => `${s.date} ${s.startTime}-${s.endTime}`)
      .join('; ');
  }

  /* =========================
     Submit
  ==========================*/
  onSubmit(): void {
    this.responseMessage = '';
    this.isAdded = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const doctorId = this.form.getRawValue().doctorId as number | null;
    if (!doctorId) {
      this.responseMessage = 'Doctor ID not found. Please login again.';
      return;
    }

    const availabilityText = this.buildAvailabilityText();
    if (!availabilityText) {
      this.responseMessage = 'Please add at least one valid time slot.';
      return;
    }

    this.httpService.updateDoctorAvailability(doctorId, availabilityText).subscribe({
      next: () => {
        this.responseMessage = 'Availability updated successfully';
        this.isAdded = true;

        this.slots.clear();
        this.addSlot();
      },
      error: () => {
        this.responseMessage = 'Failed to update availability';
        this.isAdded = false;
      }
    });
  }
}
